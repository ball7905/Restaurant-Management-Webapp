USE DB_RESTAURANT

-- ========================================================
-- PROCEDURE ĐẶT BÀN
-- ========================================================
GO
CREATE TRIGGER trg_KiemTraDatBan
ON DATBAN
FOR INSERT, UPDATE
AS
BEGIN
    -- 1. Check Thời gian đặt không được ở quá khứ (Chỉ check khi Insert mới hoặc Update giờ)
    IF EXISTS (SELECT 1 FROM inserted WHERE ThoiGianDat < GETUTCDATE())
    BEGIN
        RAISERROR (N'Lỗi: Thời gian đặt bàn không được nhỏ hơn thời điểm hiện tại.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- 2. Check Logic Chuyển đổi trạng thái hợp lệ
    IF EXISTS (
        SELECT 1 
        FROM deleted d 
        JOIN inserted i ON d.ID_DatBan = i.ID_DatBan
        WHERE (d.TrangThai = N'Đã hủy' AND i.TrangThai <> N'Đã hủy') -- Đơn đã hủy không thể chọn trạng thái khác
           OR (d.TrangThai = N'Đã nhận bàn' AND i.TrangThai = N'Đã đặt') -- Đã vào ăn thì không quay lại đặt
    )
    BEGIN
        RAISERROR (N'Lỗi: Chuyển đổi trạng thái đặt bàn không hợp lệ.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;

-- BackEnd cần xử lý thao tác sp_TaoDatBan va spNhanBan cho khách đặt trc và khách vãng lai:
--  Đặt trc: thao tác được gọi cách nhau
--  Vãng lai:2 thao tác cần được gọi tuần tự tại cùng 1 thời điểm

GO
CREATE PROCEDURE sp_TaoDatBan
    @SDT_Khach      VARCHAR(20),
    @TenKhach       NVARCHAR(50), -- Để tạo mới nếu chưa có
    @SoLuongKhach   INT,
    @ThoiGianDat    DATETIME2,
    @ID_Ban         INT = NULL, -- Optional: Nếu khách chỉ định bàn cụ thể
    @ID_LeTan       INT,
    @GhiChu         NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        -- VALIDATION
        -- Thời gian đặt phải ở tương lai
        -- Tuy nhiên có xử lý trường hợp tiếp khách vãng lai sẽ cho phép:
        --  thời gian đặt sẽ sớm hơn GETUTCDATE() 10p để xử lý độ trễ thao tác
        IF @ThoiGianDat < DATEADD(MINUTE, -10, GETUTCDATE())
            THROW 50001, N'Lỗi: Thời gian đặt phải ở tương lai', 1;

        IF @SoLuongKhach <= 0
            THROW 50002, N'Lỗi: Số lượng khách phải lớn hơn 0.', 1;

        -- Tạo khách hàng nếu khách hàng chưa tồn tại trong db
        IF NOT EXISTS (SELECT 1 FROM KHACHHANG WHERE SDT = @SDT_Khach)
        BEGIN
            -- Tự động tạo khách vãng lai nếu chưa có
            INSERT INTO KHACHHANG (SDT, HoTen, Flag_ThanhVien) 
            VALUES (@SDT_Khach, @TenKhach, 0);
        END

        -- XỬ LÝ TABLE TURNOVER
        -- Định nghĩa khung giờ bận: [ThoiGianDat - 1h] đến [ThoiGianDat + 1h]
        -- Bất kỳ đơn đặt bàn nào nằm trong khung này coi như gây xung đột.
        DECLARE @GioBatDau DATETIME2 = DATEADD(HOUR, -1, @ThoiGianDat);
        DECLARE @GioKetThuc DATETIME2 = DATEADD(HOUR, 1, @ThoiGianDat);

        -- CASE: (KHÁCH CHỈ ĐỊNH BÀN) hoặc (LỄ TÂN CHỌN BÀN)
        IF @ID_Ban IS NOT NULL
        BEGIN
            -- Check 1: Bàn có tồn tại và đủ sức chứa không?
            IF NOT EXISTS (SELECT 1 FROM BAN WHERE ID_Ban = @ID_Ban AND SucChua >= @SoLuongKhach)
                THROW 50003, N'Lỗi: Bàn không tồn tại hoặc sức chứa không đủ.', 1;

            -- Check 2: Bàn có bị trùng lịch trong khung giờ +/- 1 tiếng không? (không check đơn đã hủy)
            IF EXISTS (
                SELECT 1 FROM DATBAN 
                WHERE ID_Ban = @ID_Ban 
                  AND TrangThai IN (N'Đã đặt', N'Đã nhận bàn') -- Chỉ check lịch active
                  AND ThoiGianDat BETWEEN @GioBatDau AND @GioKetThuc
            )
            THROW 50004, N'Lỗi: Thời gian đặt không khả dụng', 1;
        END
        
        -- CASE: Khách không chỉ định -> Hệ thống tự gợi ý
        -- Chưa thể hiện được trong frontend
        ELSE
        BEGIN
            -- Tìm 1 bàn thỏa mãn: Đủ sức chứa VÀ Không bị trùng lịch (ưu tiên bàn nhỏ nhất thỏa đk)
            SELECT TOP(1) @ID_Ban = B.ID_Ban
            FROM BAN B
            WHERE B.SucChua >= @SoLuongKhach
              AND NOT EXISTS (
                  SELECT 1 FROM DATBAN DB
                  WHERE DB.ID_Ban = B.ID_Ban
                    AND DB.TrangThai IN (N'Đã đặt', N'Đã nhận bàn')
                    AND DB.ThoiGianDat BETWEEN @GioBatDau AND @GioKetThuc
              )
            ORDER BY B.SucChua ASC;

            IF @ID_Ban IS NULL
                THROW 50005, N'Lỗi: Không còn bàn trống khả dụng.', 1;
        END

        -- =============================================
        -- TẠO ĐƠN ĐẶT BÀN
        -- =============================================
        INSERT INTO DATBAN (SoLuongKhach, ThoiGianDat, TrangThai, GhiChu, ID_LeTan, SDT_Khach, ID_Ban)
        VALUES (@SoLuongKhach, @ThoiGianDat, N'Đã đặt', @GhiChu, @ID_LeTan, @SDT_Khach, @ID_Ban);
        
        UPDATE BAN SET TrangThai = N'Đã đặt' WHERE ID_Ban = @ID_Ban;
        COMMIT TRANSACTION;
        PRINT N'Đặt bàn thành công! Mã bàn: ' + CAST(@ID_Ban AS NVARCHAR(10));
        SELECT N'Đặt bàn thành công! Mã bàn: ' + CAST(@ID_Ban AS NVARCHAR(10)) AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;

GO
CREATE PROCEDURE sp_NhanBan
    @ID_DatBan INT,
    @ID_LeTan  INT,
    @ID_PhucVu INT -- Cần thiết để khởi tạo đon gọi món
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Validate
        IF NOT EXISTS (SELECT 1 FROM DATBAN WHERE ID_DatBan = @ID_DatBan AND TrangThai = N'Đã đặt')
            THROW 50001, N'Lỗi: Phiếu đặt bàn không tồn tại hoặc trạng thái không hợp lệ.', 1;

        DECLARE @ID_Ban INT;
        SELECT @ID_Ban = ID_Ban FROM DATBAN WHERE ID_DatBan = @ID_DatBan;

        -- 2. Update DATBAN -> Đã nhận
        UPDATE DATBAN 
        SET TrangThai = N'Đã nhận bàn' 
        WHERE ID_DatBan = @ID_DatBan;

        -- 3. Update BAN -> Đang phục vụ (Real-time status)
        UPDATE BAN 
        SET TrangThai = N'Đang phục vụ' 
        WHERE ID_Ban = @ID_Ban;

        -- 4. Tự động tạo DONGOIMON (Mở bill)
        -- ID_PhucVu tạm thời NULL hoặc gán đại diện, sau này cập nhật khi gọi món
        INSERT INTO DONGOIMON (ThoiGianTao, TrangThai, ID_Ban, ID_PhucVu)
        VALUES (SYSUTCDATETIME(), N'Đang phục vụ', @ID_Ban, @ID_PhucVu);

        COMMIT TRANSACTION;
        PRINT N'Khách đã nhận bàn. Đơn gọi món đã được tạo.';
        SELECT N'Khách đã nhận bàn. Đơn gọi món đã được tạo.' AS Message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO
CREATE PROCEDURE sp_HuyDatBan
    @ID_DatBan INT,
    @GhiChuHuy NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM DATBAN WHERE ID_DatBan = @ID_DatBan AND TrangThai = N'Đã đặt')
            THROW 50001, N'Lỗi: Chỉ có thể hủy các đơn ở trạng thái Đã đặt.', 1;

        DECLARE @ID_Ban INT;
        SELECT @ID_Ban = ID_Ban FROM DATBAN WHERE ID_DatBan = @ID_DatBan;

        -- 1. Update DATBAN -> Đã hủy
        UPDATE DATBAN 
        SET TrangThai = N'Đã hủy',
            GhiChu = ISNULL(GhiChu, '') + N' | Lý do hủy: ' + ISNULL(@GhiChuHuy, N'Khách hủy')
        WHERE ID_DatBan = @ID_DatBan;

        -- 2. Trả trạng thái BAN về Trống (Nếu trước đó set là đã đặt)
        UPDATE BAN 
        SET TrangThai = N'Trống' 
        WHERE ID_Ban = @ID_Ban AND TrangThai = N'Đã đặt';

        COMMIT TRANSACTION;
        PRINT N'Đã hủy đặt bàn thành công.';
        SELECT N'Đã hủy đặt bàn thành công.' AS Message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

-- ========================================================
-- TRIGGER DONGOIMON 
-- ========================================================

-- NOTE: các PROC tạo cập nhật đon gọi món sẽ được xử lý bên trong việc đặt bàn và khi dóng đơn
GO
CREATE TRIGGER trg_KiemTraDonGoiMon
ON DONGOIMON
FOR INSERT, UPDATE
AS
BEGIN
    -- 1. Chặn việc chuyển trạng thái ngược (Đã thanh toán -> Đang phục vụ)  --> Chỉ cho update
    IF EXISTS (
        SELECT 1 
        FROM deleted d 
        JOIN inserted i ON d.ID = i.ID
        WHERE d.TrangThai = N'Đã thanh toán' AND i.TrangThai = N'Đang phục vụ'
    )
    BEGIN
        RAISERROR (N'Lỗi: Không thể chuyển đơn từ "Đã thanh toán" sang "Đang phục vụ".', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- 2. Chặn việc tạo đơn mới trên Bàn đang bận (Chỉ check khi Insert)
    IF EXISTS (
        SELECT 1 
        FROM inserted i
        JOIN DONGOIMON d ON i.ID_Ban = d.ID_Ban
        WHERE i.ID <> d.ID -- Khác chính nó
          AND d.TrangThai = N'Đang phục vụ' -- Đơn cũ chưa đóng
          AND i.TrangThai = N'Đang phục vụ' -- Đơn mới định mở
    )
    BEGIN
        RAISERROR (N'Lỗi: Bàn này đang có đơn hàng chưa thanh toán. Vui lòng thanh toán đơn cũ trước khi mở đơn mới.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;

-- ========================================================
-- PROCEDURE CHO NGHIỆP VỤ ORDERING
-- ========================================================
GO
CREATE PROCEDURE sp_TaoLanGoiMon
    @ID_Don     INT,
    @GhiChu     NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @ThoiDiemGoi DATETIME2 = SYSUTCDATETIME();

        -- VALIDATION
        -- Phải tồn tại và đang phục vụ
        IF NOT EXISTS (SELECT 1 FROM DONGOIMON WHERE ID = @ID_Don AND TrangThai = N'Đang phục vụ')
            THROW 50001, N'Lỗi: Đơn hàng không tồn tại hoặc đã thanh toán.', 1;

        -- 2. VALIDATE ĐƠN HÀNG & LẤY DỮ LIỆU CẦN THIẾT (Gộp Query)
        DECLARE @ID_PhucVu INT;
        DECLARE @ThoiGianTaoDon DATETIME2;

        SELECT 
            @ID_PhucVu = ID_PhucVu,
            @ThoiGianTaoDon = ThoiGianTao
        FROM DONGOIMON 
        WHERE ID = @ID_Don AND TrangThai = N'Đang phục vụ';

        IF @ThoiGianTaoDon IS NULL
            THROW 50001, N'Lỗi: Đơn hàng không tồn tại hoặc đã thanh toán.', 1;
        IF @ThoiDiemGoi < @ThoiGianTaoDon
            THROW 50002, N'Lỗi logic: Thời điểm gọi món không thể xảy ra trước khi đơn hàng được tạo.', 1;
        -- Lấy thông tin bếp trưởng
        DECLARE @ID_BepTruongActive INT;
        SELECT TOP(1) @ID_BepTruongActive = ID 
        FROM BEPTRUONG 
        WHERE NgayKetThuc IS NULL;
        -- 4. Tạo Lần Gọi Món mới
        IF @ID_BepTruongActive IS NULL
            PRINT N'Cảnh báo: Hiện tại hệ thống không tìm thấy Bếp trưởng đang tại chức.';

        INSERT INTO LANGOIMON (ID_Don, ThoiDiemGoi, TrangThai, GhiChu, ID_PhucVu, ID_BepTruong)
        VALUES (@ID_Don, @ThoiDiemGoi, N'Đang xử lý', @GhiChu, @ID_PhucVu, @ID_BepTruongActive);

        -- Trả về ID Lần gọi để Backend dùng tiếp cho việc add món
        DECLARE @NewID INT = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        SELECT N'Đã tạo lần gọi món thành công!' AS Message
        -- Return kết quả
        SELECT @NewID AS ID_LanGoiMoi;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;

GO
CREATE PROCEDURE sp_ThemMonVaoLanGoi
    @ID_LanGoi  INT,
    @ID_MonAn   INT,
    @SoLuong    INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- VALDATION
        -- Chỉ được thêm món vào các lần gọi đang 'Đang xử lý' (Chưa nấu xong)
        IF NOT EXISTS (SELECT 1 FROM LANGOIMON WHERE ID = @ID_LanGoi AND TrangThai = N'Đang xử lý')
            THROW 50001, N'Lỗi: Lần gọi món này đã hoàn tất hoặc không tồn tại.', 1;

        IF @SoLuong <= 0
            THROW 50002, N'Lỗi: Số lượng phải lớn hơn 0.', 1;

        -- Validate Món ăn & Tình trạng phục vụ
        DECLARE @DonGiaHienTai DECIMAL(12,0);
        DECLARE @DangPhucVu BIT;
        DECLARE @DangKinhDoanh BIT;

        SELECT 
            @DonGiaHienTai = DonGia, 
            @DangPhucVu = DangPhucVu,
            @DangKinhDoanh = DangKinhDoanh
        FROM MONAN 
        WHERE ID = @ID_MonAn;

        -- Check tồn tại
        IF @DonGiaHienTai IS NULL
            THROW 50003, N'Lỗi: Món ăn không tồn tại.', 1;

        -- Check Soft Delete (Đã xóa khỏi menu)
        IF @DangKinhDoanh = 0
            THROW 50004, N'Lỗi: Món ăn này đã ngừng kinh doanh (Xóa khỏi thực đơn).', 1;

        -- Check Availability (Hết hàng tạm thời)
        IF @DangPhucVu = 0
            THROW 50005, N'Lỗi: Món ăn này hiện đang tạm ngưng phục vụ (Hết nguyên liệu).', 1;

        -- Upsert Món ăn (Nếu món đó đã có trong lần gọi này thì cộng dồn số lượng, chưa có thì thêm mới)
        IF EXISTS (SELECT 1 FROM LANGOIMON_MON WHERE ID_LanGoi = @ID_LanGoi AND ID_MonAn = @ID_MonAn)
        BEGIN
            UPDATE LANGOIMON_MON
            SET SoLuong = SoLuong + @SoLuong
            WHERE ID_LanGoi = @ID_LanGoi AND ID_MonAn = @ID_MonAn;
        END
        ELSE
        BEGIN
            INSERT INTO LANGOIMON_MON (ID_LanGoi, ID_MonAn, SoLuong, DonGiaThoiDiem)
            VALUES (@ID_LanGoi, @ID_MonAn, @SoLuong, @DonGiaHienTai);
        END

        PRINT N'Đã thêm món thành công.';
        SELECT N'Đã thêm món thành công.' AS Message;

    END TRY
    BEGIN CATCH
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;

GO
CREATE PROCEDURE sp_CapNhatTrangThaiLanGoi
    @ID_LanGoi      INT,
    @TrangThaiMoi   NVARCHAR(20), -- 'Sẵn sàng phục vụ' hoặc 'Đã phục vụ'
    @ID_NhanVien    INT -- Người thực hiện (Bếp trưởng hoặc Phục vụ)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Lấy trạng thái hiện tại
        DECLARE @TrangThaiCu NVARCHAR(20);
        SELECT @TrangThaiCu = TrangThai FROM LANGOIMON WHERE ID = @ID_LanGoi;

        IF @TrangThaiCu IS NULL
            THROW 50001, N'Lỗi: Lần gọi món không tồn tại.', 1;

        -- Xử lý Logic chuyển trạng thái
        
        -- CASE 1: Bếp xác nhận nấu xong (Đang xử lý -> Sẵn sàng)
        IF @TrangThaiMoi = N'Sẵn sàng phục vụ'
        BEGIN
            IF @TrangThaiCu <> N'Đang xử lý'
                THROW 50002, N'Lỗi: Chỉ có thể xác nhận sẵn sàng cho các đơn đang xử lý.', 1;
            UPDATE LANGOIMON 
            SET TrangThai = @TrangThaiMoi, 
                ID_BepTruong = @ID_NhanVien 
            WHERE ID = @ID_LanGoi;
        END

        -- CASE 2: Phục vụ xác nhận đã bưng ra (Sẵn sàng -> Đã phục vụ)
        ELSE IF @TrangThaiMoi = N'Đã phục vụ'
        BEGIN
            -- Cho phép chuyển từ 'Đang xử lý' luôn (trường hợp món nguội ko cần nấu như Nước ngọt)
            --  hoặc từ 'Sẵn sàng phục vụ'
            UPDATE LANGOIMON 
            SET TrangThai = @TrangThaiMoi 
            WHERE ID = @ID_LanGoi;
        END

        ELSE
        BEGIN
            ;THROW 50003, N'Lỗi: Trạng thái không hợp lệ.', 1;
        END

        COMMIT TRANSACTION;
        PRINT N'Cập nhật trạng thái thành công: ' + @TrangThaiMoi;
        SELECT N'Cập nhật trạng thái thành công: ' + @TrangThaiMoi AS Message

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;


-- ========================================================
-- PROCEDURE THANH TOÁN
-- ========================================================
GO
CREATE PROCEDURE sp_ThanhToan
    @ID_Don             INT,
    @ID_LeTan           INT,
    @PhuongThuc         NVARCHAR(50),
    
    -- Các tham số Giảm giá (Optional)
    @SDT_Khach          VARCHAR(20) = NULL, -- Khách thành viên (để tích/trừ điểm)
    @DiemSuDung         INT = 0,            -- Số điểm khách muốn dùng để giảm giá
    @GiamGiaTheoLuong   DECIMAL(12,0) = 0,  -- Giảm giá tiền mặt trực tiếp (Voucher)
    @PhanTramGiam       FLOAT = 0           -- Giảm giá theo % (VD: 10 = 10%)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- EXTRACT ID LỄ TÂN
        IF @ID_LeTan IS NULL THROW 50000, N'Lỗi: Tài khoản không tồn tại.', 1;

        -- VALIDATE ĐƠN HÀNG
        IF NOT EXISTS (SELECT 1 FROM DONGOIMON WHERE ID = @ID_Don AND TrangThai = N'Đang phục vụ')
            THROW 50001, N'Lỗi: Đơn hàng không tồn tại hoặc đã được thanh toán.', 1;

        -- TÍNH TỔNG TIỀN MÓN
        DECLARE @TongTienMon DECIMAL(18,0) = 0;
        
        SELECT @TongTienMon = ISNULL(SUM(CT.ThanhTien), 0)
        FROM LANGOIMON_MON CT
        JOIN LANGOIMON L ON CT.ID_LanGoi = L.ID
        WHERE L.ID_Don = @ID_Don;

        IF @TongTienMon = 0
            PRINT N'Cảnh báo: Đơn hàng có giá trị 0 đồng.';

        -- CHECK Thời gian thanh toán (Hiện tại) > Thời gian gọi món cuối cùng
        DECLARE @LanGoiCuoi DATETIME2;
        SELECT @LanGoiCuoi = MAX(ThoiDiemGoi) FROM LANGOIMON WHERE ID_Don = @ID_Don;

        IF @LanGoiCuoi IS NOT NULL AND SYSUTCDATETIME() < @LanGoiCuoi
            THROW 50002, N'Lỗi logic: Thời gian thanh toán không được xảy ra trước lần gọi món cuối cùng.', 1;

        -- XỬ LÝ GIẢM GIÁ
        DECLARE @TongGiamGia DECIMAL(18,0) = 0;
        DECLARE @GiamGiaTuDiem DECIMAL(18,0) = 0;
        DECLARE @GiamGiaTuPercent DECIMAL(18,0) = 0;
        -- a. Xử lý Điểm tích lũy (Nếu có SDT và dùng điểm)
        IF @SDT_Khach IS NOT NULL AND @DiemSuDung > 0
        BEGIN
            DECLARE @DiemHienCo INT;
            SELECT @DiemHienCo = DiemTichLuy 
            FROM KHACHHANG 
            WHERE SDT = @SDT_Khach AND Flag_ThanhVien = 1; -- Chỉ check thành viên

            IF @DiemHienCo IS NULL 
                THROW 50003, N'Lỗi: Khách hàng không phải thành viên hoặc không tồn tại.', 1;
            
            IF @DiemHienCo < @DiemSuDung
                THROW 50004, N'Lỗi: Điểm tích lũy của khách không đủ.', 1;

            -- Quy đổi: 1 Điểm = 1.000 VNĐ
            SET @GiamGiaTuDiem = @DiemSuDung * 1000;
            
            -- Trừ điểm ngay lập tức
            UPDATE KHACHHANG SET DiemTichLuy = DiemTichLuy - @DiemSuDung WHERE SDT = @SDT_Khach;
        END

        -- b. Xử lý Phần trăm
        IF @PhanTramGiam > 0
        BEGIN
            SET @GiamGiaTuPercent = @TongTienMon * (@PhanTramGiam / 100.0);
        END

        -- Tổng hợp giảm giá
        SET @TongGiamGia = @GiamGiaTheoLuong + @GiamGiaTuDiem + @GiamGiaTuPercent;

        -- Check: Giảm giá không được vượt quá tổng tiền
        IF @TongGiamGia > @TongTienMon
            SET @TongGiamGia = @TongTienMon; -- Cập nhật lại bằng tổng tiền (Miễn phí)

        -- INSERT BẢNG THANH TOÁN
        -- ThanhTien sẽ được tự động tính bởi cột Computed Column
        INSERT INTO THANHTOAN (ID_Don, ID_LeTan, SDT_Khach, ThoiGianThanhToan, PhuongThuc, TongTienMon, GiamGia)
        VALUES (@ID_Don, @ID_LeTan, @SDT_Khach, SYSUTCDATETIME(), @PhuongThuc, @TongTienMon, @TongGiamGia);

        -- TÍCH ĐIỂM (Sau khi đã trừ giảm giá)
        IF @SDT_Khach IS NOT NULL
        BEGIN
            IF EXISTS (SELECT 1 FROM KHACHHANG WHERE SDT = @SDT_Khach AND Flag_ThanhVien = 1)
            BEGIN
                DECLARE @ThanhTienThucTe DECIMAL(18,0) = @TongTienMon - @TongGiamGia;
                DECLARE @DiemCong INT = FLOOR(@ThanhTienThucTe / 100000);
                
                IF @DiemCong > 0
                BEGIN
                    UPDATE KHACHHANG 
                    SET DiemTichLuy = DiemTichLuy + @DiemCong 
                    WHERE SDT = @SDT_Khach AND Flag_ThanhVien = 1;
                END
            END
        END

        -- ĐÓNG ĐƠN & GIẢI PHÓNG BÀN
        UPDATE DONGOIMON SET TrangThai = N'Đã thanh toán' WHERE ID = @ID_Don;

        DECLARE @ID_Ban INT;
        SELECT @ID_Ban = ID_Ban FROM DONGOIMON WHERE ID = @ID_Don;
        IF @ID_Ban IS NOT NULL
            UPDATE BAN SET TrangThai = N'Trống' WHERE ID_Ban = @ID_Ban;

        COMMIT TRANSACTION;
        PRINT N'Thanh toán thành công. Tổng tiền: ' + CAST(@TongTienMon AS NVARCHAR(20)) + N'. Thực thu: ' + CAST((@TongTienMon - @TongGiamGia) AS NVARCHAR(20));
        SELECT N'Thanh toán thành công. Tổng tiền: ' + CAST(@TongTienMon AS NVARCHAR(20)) + N'. Thực thu: ' + CAST((@TongTienMon - @TongGiamGia) AS NVARCHAR(20)) AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;
GO