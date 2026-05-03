DROP TABLE IF EXISTS DONGOIMON;
CREATE TABLE DONGOIMON (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ThoiGianTao     DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),
    TrangThai       NVARCHAR(20)        NOT NULL CHECK (TrangThai IN (N'Đang phục vụ', N'Đã thanh toán', N'Đã xuất hóa đơn')),
    
    ID_Ban          INT                 NULL,
    ID_PhucVu       INT                 NULL,
    TongTienTamTinh DECIMAL(18, 0)      DEFAULT 0
);

CREATE TABLE KHUYENMAI (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    MaKM            VARCHAR(20)         NOT NULL UNIQUE,
    MoTa            NVARCHAR(255)       NULL,
    GiaTriToiThieu  DECIMAL(18,0)       NOT NULL DEFAULT 0 CHECK (GiaTriToiThieu >= 0),
    PhanTramGiam    DECIMAL(5,2)        NOT NULL DEFAULT 0 CHECK (PhanTramGiam >= 0 AND PhanTramGiam <= 100),
    NgayHetHan      DATE                NULL
);

CREATE TABLE HOADON (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ID_Don          INT                 NOT NULL, -- Tham chiếu DONGOIMON
    ID_LeTan        INT                 NULL,     -- Nhân viên xuất hóa đơn
    SDT_Khach       VARCHAR(20)         NULL,     -- Khách hàng
    
    ThoiGianTao     DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),
    
    TongTienMon     DECIMAL(18,0)       NOT NULL DEFAULT 0 CHECK (TongTienMon >= 0), -- Lấy từ DONGOIMON
    Thue            DECIMAL(18,0)       NOT NULL DEFAULT 0 CHECK (Thue >= 0),        -- Tiền thuế (VD: 8% hoặc 10%)
    TongGiamGia     DECIMAL(18,0)       NOT NULL DEFAULT 0 CHECK (TongGiamGia >= 0),
    
    ThanhTien       AS (TongTienMon + Thue - TongGiamGia) PERSISTED -- Tổng tiền cuối cùng khách phải trả
);

CREATE TABLE HOADON_KHUYENMAI (
    ID_HoaDon       INT                 NOT NULL,
    ID_KhuyenMai    INT                 NOT NULL,
    PRIMARY KEY (ID_HoaDon, ID_KhuyenMai)
);

CREATE TABLE GIAODICHTHANHTOAN (
    ID                  INT IDENTITY(1,1)   PRIMARY KEY,
    ID_HoaDon           INT                 NOT NULL UNIQUE, -- Thường 1 hóa đơn sẽ có 1 lần thanh toán thành công
    ID_LeTan            INT                 NOT NULL,        -- Nhân viên thu tiền
    
    SoTien              DECIMAL(18,0)       NOT NULL CHECK (SoTien >= 0),
    ThoiGianGiaoDich    DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),
    PhuongThuc          NVARCHAR(50)        NOT NULL CHECK (PhuongThuc IN (N'Tiền mặt', N'Chuyển khoản', N'Thẻ', N'Ví điện tử')),
    TrangThai           NVARCHAR(20)        NOT NULL DEFAULT N'Chờ xử lý' 
                        CHECK (TrangThai IN (N'Thành công', N'Thất bại', N'Chờ xử lý'))
);

-- 1. Khóa ngoại cho bảng HOADON
ALTER TABLE HOADON ADD
    CONSTRAINT FK_HOADON_DON FOREIGN KEY (ID_Don) REFERENCES DONGOIMON(ID),
    CONSTRAINT FK_HOADON_LETAN FOREIGN KEY (ID_LeTan) REFERENCES LETAN(ID),
    CONSTRAINT FK_HOADON_KHACH FOREIGN KEY (SDT_Khach) REFERENCES KHACHHANG(SDT);

-- 2. Khóa ngoại cho bảng trung gian HOADON_KHUYENMAI
-- Dùng ON DELETE CASCADE để nếu xóa Hóa Đơn thì lịch sử áp mã Khuyến mãi của hóa đơn đó cũng tự mất
ALTER TABLE HOADON_KHUYENMAI ADD
    CONSTRAINT FK_HDKM_HOADON FOREIGN KEY (ID_HoaDon) REFERENCES HOADON(ID) ON DELETE CASCADE,
    CONSTRAINT FK_HDKM_KHUYENMAI FOREIGN KEY (ID_KhuyenMai) REFERENCES KHUYENMAI(ID);

-- 3. Khóa ngoại cho bảng GIAODICHTHANHTOAN
ALTER TABLE GIAODICHTHANHTOAN ADD
    CONSTRAINT FK_GIAODICH_HOADON FOREIGN KEY (ID_HoaDon) REFERENCES HOADON(ID),
    CONSTRAINT FK_GIAODICH_LETAN FOREIGN KEY (ID_LeTan) REFERENCES LETAN(ID);

-- ========================================================
-- DỮ LIỆU BẢNG KHUYẾN MÃI
-- ========================================================
INSERT INTO KHUYENMAI (MaKM, MoTa, GiaTriToiThieu, PhanTramGiam, NgayHetHan)
VALUES 
-- 1. Mã khai trương: Giảm đậm 20%, áp dụng cho mọi hóa đơn (Tối thiểu 0đ), hạn đến cuối năm 2026
('KHAITRUONG', N'Ưu đãi tưng bừng khai trương quán', 0, 20.00, '2026-12-31'),

-- 2. Mã cơ bản: Giảm 10%, nhưng yêu cầu khách phải ăn bill từ 500.000đ trở lên mới được áp dụng
('GIAM10', N'Giảm 10% cho hóa đơn từ 500k', 500000, 10.00, '2026-12-31'),

-- 3. Mã tiệc lớn: Giảm 15%, yêu cầu bill cực cao (2.000.000đ) dành cho khách đoàn/VIP
('TIECLON', N'Giảm 15% cho khách đoàn, hóa đơn từ 2 triệu', 2000000, 15.00, '2026-06-30'),

-- 4. Mã vô thời hạn: Giảm nhẹ 5%, yêu cầu hóa đơn 200k, và cột NgayHetHan để NULL (Dùng mãi mãi)
('THUONGNIEN', N'Voucher tri ân khách hàng tiêu chuẩn (Không hết hạn)', 200000, 5.00, NULL),

-- 5. Mã dùng để TEST LỖI: Ngày hết hạn là tháng 2/2026 (Trong khi thời điểm hiện tại đã qua ngày này)
('TET2026', N'Mã ưu đãi dịp Tết 2026 (Đã hết hạn để test tính năng)', 300000, 15.00, '2026-02-15');
GO

-- ========================================================
-- 1. CẬP NHẬT TRIGGER KIỂM TRA ĐƠN GỌI MÓN
-- ========================================================
-- Thêm các trạng thái mới để quản lý chặt hơn ('Đã xuất hóa đơn', 'Đã thanh toán', 'Đã hủy')
DROP PROCEDURE IF EXISTS trg_KiemTraDonGoiMon;
GO

CREATE TRIGGER trg_KiemTraDonGoiMon
ON DONGOIMON
FOR INSERT, UPDATE
AS
BEGIN
    -- Chặn việc chuyển trạng thái ngược từ Đã thanh toán quay lại Đang phục vụ
    IF EXISTS (
        SELECT 1 
        FROM deleted d 
        JOIN inserted i ON d.ID = i.ID
        WHERE d.TrangThai IN (N'Đã thanh toán', N'Đã xuất hóa đơn') 
          AND i.TrangThai = N'Đang phục vụ'
    )
    BEGIN
        RAISERROR (N'Lỗi: Không thể chuyển đơn từ "Đã thanh toán/Đã xuất hóa đơn" sang "Đang phục vụ".', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- Chặn việc tạo đơn mới trên Bàn đang có đơn chưa đóng (Chỉ check khi Insert)
    IF EXISTS (
        SELECT 1 
        FROM inserted i
        JOIN DONGOIMON d ON i.ID_Ban = d.ID_Ban
        WHERE i.ID <> d.ID 
          AND d.TrangThai IN (N'Đang phục vụ', N'Đã xuất hóa đơn') -- Đơn cũ chưa đóng hoàn toàn
          AND i.TrangThai = N'Đang phục vụ' 
    )
    BEGIN
        RAISERROR (N'Lỗi: Bàn này đang có đơn hàng chưa hoàn tất thanh toán.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO

-- ========================================================
-- 2. VIẾT LẠI PROCEDURE THANH TOÁN (TÍCH HỢP HÓA ĐƠN MỚI)
-- ========================================================
DROP PROCEDURE IF EXISTS sp_ThanhToan;
GO

-- ========================================================
-- BƯỚC 1: XUẤT HÓA ĐƠN (IN BILL TẠM TÍNH)
-- Nghiệp vụ: Chốt danh sách món, tính tiền, áp mã giảm giá, trừ điểm tích lũy. 
-- Đổi trạng thái đơn thành 'Đã xuất hóa đơn' (Không cho gọi món thêm nữa).
-- ========================================================
CREATE PROCEDURE sp_XuatHoaDon
    @ID_Don             INT,
    @ID_LeTan           INT, -- Nhân viên in bill
    
    -- Các tham số tùy chọn (Khách đưa thẻ thành viên / voucher lúc gọi tính tiền)
    @SDT_Khach          VARCHAR(20) = NULL, 
    @DiemSuDung         INT = 0,            
    @MaKM               VARCHAR(20) = NULL, 
    @ThuePhanTram       DECIMAL(5,2) = 10.0 
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. VALIDATE
        IF @ID_LeTan IS NULL THROW 50000, N'Lỗi: Nhân viên không hợp lệ.', 1;

        IF NOT EXISTS (SELECT 1 FROM DONGOIMON WHERE ID = @ID_Don AND TrangThai = N'Đang phục vụ')
            THROW 50001, N'Lỗi: Đơn hàng không tồn tại hoặc đã được chốt/thanh toán.', 1;

        -- 2. TÍNH TỔNG TIỀN MÓN
        DECLARE @TongTienMon DECIMAL(18,0) = 0;
        SELECT @TongTienMon = ISNULL(SUM(CT.ThanhTien), 0)
        FROM LANGOIMON_MON CT
        JOIN LANGOIMON L ON CT.ID_LanGoi = L.ID
        WHERE L.ID_Don = @ID_Don;

        -- 3. XỬ LÝ TRỪ ĐIỂM TÍCH LŨY
        DECLARE @TongGiamGia DECIMAL(18,0) = 0;
        DECLARE @GiamGiaTuDiem DECIMAL(18,0) = 0;

        IF @SDT_Khach IS NOT NULL AND @DiemSuDung > 0
        BEGIN
            DECLARE @DiemHienCo INT;
            SELECT @DiemHienCo = DiemTichLuy FROM KHACHHANG WHERE SDT = @SDT_Khach AND Flag_ThanhVien = 1;

            IF @DiemHienCo IS NULL THROW 50002, N'Lỗi: Khách hàng không tồn tại hoặc không phải thành viên.', 1;
            IF @DiemHienCo < @DiemSuDung THROW 50003, N'Lỗi: Điểm tích lũy không đủ.', 1;

            SET @GiamGiaTuDiem = @DiemSuDung * 1000;
            -- Trừ điểm ngay lập tức để tránh xài đúp
            UPDATE KHACHHANG SET DiemTichLuy = DiemTichLuy - @DiemSuDung WHERE SDT = @SDT_Khach;
        END

        -- 4. XỬ LÝ MÃ KHUYẾN MÃI
        DECLARE @ID_KhuyenMai INT = NULL;
        DECLARE @GiamGiaTuKM DECIMAL(18,0) = 0;

        IF @MaKM IS NOT NULL AND @MaKM <> ''
        BEGIN
            DECLARE @PhanTramGiam DECIMAL(5,2);
            DECLARE @GiaTriToiThieu DECIMAL(18,0);
            DECLARE @NgayHetHan DATE;

            SELECT @ID_KhuyenMai = ID, @PhanTramGiam = PhanTramGiam, @GiaTriToiThieu = GiaTriToiThieu, @NgayHetHan = NgayHetHan
            FROM KHUYENMAI WHERE MaKM = @MaKM;

            IF @ID_KhuyenMai IS NULL THROW 50004, N'Lỗi: Mã khuyến mãi không tồn tại.', 1;
            IF @NgayHetHan IS NOT NULL AND @NgayHetHan < CAST(GETUTCDATE() AS DATE) THROW 50005, N'Lỗi: Mã khuyến mãi đã hết hạn.', 1;
            IF @TongTienMon < @GiaTriToiThieu THROW 50006, N'Lỗi: Đơn hàng chưa đạt giá trị tối thiểu.', 1;

            SET @GiamGiaTuKM = @TongTienMon * (@PhanTramGiam / 100.0);
        END

        -- 5. CHỐT SỐ TIỀN & THUẾ
        SET @TongGiamGia = @GiamGiaTuDiem + @GiamGiaTuKM;
        IF @TongGiamGia > @TongTienMon SET @TongGiamGia = @TongTienMon;

        DECLARE @TienSauGiam DECIMAL(18,0) = @TongTienMon - @TongGiamGia;
        DECLARE @Thue DECIMAL(18,0) = @TienSauGiam * (@ThuePhanTram / 100.0);

        -- 6. TẠO HÓA ĐƠN
        INSERT INTO HOADON (ID_Don, ID_LeTan, SDT_Khach, TongTienMon, Thue, TongGiamGia)
        VALUES (@ID_Don, @ID_LeTan, @SDT_Khach, @TongTienMon, @Thue, @TongGiamGia);
        
        DECLARE @ID_HoaDon INT = SCOPE_IDENTITY();

        IF @ID_KhuyenMai IS NOT NULL
            INSERT INTO HOADON_KHUYENMAI (ID_HoaDon, ID_KhuyenMai) VALUES (@ID_HoaDon, @ID_KhuyenMai);

        -- 7. CHỐT ĐƠN
        UPDATE DONGOIMON SET TrangThai = N'Đã xuất hóa đơn' WHERE ID = @ID_Don;

        COMMIT TRANSACTION;
        SELECT N'Đã in tạm tính thành công' AS Message, @ID_HoaDon AS ID_HoaDon;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;
GO

-- ========================================================
-- BƯỚC 2: XÁC NHẬN THANH TOÁN
-- Nghiệp vụ: Thu tiền của khách, ghi nhận giao dịch, cộng điểm tích lũy.
-- Đổi trạng thái đơn thành 'Đã thanh toán' và giải phóng Bàn.
-- ========================================================
CREATE PROCEDURE sp_XacNhanThanhToan
    @ID_HoaDon          INT,
    @ID_LeTan           INT, -- Người trực tiếp thu tiền (có thể khác người in bill)
    @PhuongThuc         NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. LẤY THÔNG TIN TỪ HÓA ĐƠN ĐỂ KIỂM TRA
        DECLARE @ID_Don INT;
        DECLARE @SDT_Khach VARCHAR(20);
        DECLARE @ThanhTien DECIMAL(18,0);

        SELECT @ID_Don = ID_Don, @SDT_Khach = SDT_Khach, @ThanhTien = ThanhTien
        FROM HOADON WHERE ID = @ID_HoaDon;

        IF @ID_Don IS NULL THROW 50000, N'Lỗi: Hóa đơn không tồn tại.', 1;

        -- Check xem đã thu tiền chưa (tránh tình trạng bấm thanh toán đúp 2 lần)
        IF EXISTS (SELECT 1 FROM GIAODICHTHANHTOAN WHERE ID_HoaDon = @ID_HoaDon AND TrangThai = N'Thành công')
            THROW 50001, N'Lỗi: Hóa đơn này đã được thanh toán rồi.', 1;
            
        -- Check trạng thái đơn gọi món
        IF NOT EXISTS (SELECT 1 FROM DONGOIMON WHERE ID = @ID_Don AND TrangThai = N'Đã xuất hóa đơn')
            THROW 50002, N'Lỗi: Đơn gọi món không ở trạng thái chờ thu tiền.', 1;

        -- 2. GHI NHẬN GIAO DỊCH
        INSERT INTO GIAODICHTHANHTOAN (ID_HoaDon, ID_LeTan, SoTien, PhuongThuc, TrangThai)
        VALUES (@ID_HoaDon, @ID_LeTan, @ThanhTien, @PhuongThuc, N'Thành công');

        -- 3. TÍCH ĐIỂM CHO KHÁCH (Dựa trên số tiền thực trả)
        IF @SDT_Khach IS NOT NULL
        BEGIN
            -- 100.000 VNĐ = 1 điểm tích lũy
            DECLARE @DiemCong INT = FLOOR(@ThanhTien / 100000);
            IF @DiemCong > 0
            BEGIN
                UPDATE KHACHHANG 
                SET DiemTichLuy = DiemTichLuy + @DiemCong 
                WHERE SDT = @SDT_Khach AND Flag_ThanhVien = 1;
            END
        END

        -- 4. HOÀN TẤT ĐƠN HÀNG & GIẢI PHÓNG BÀN
        UPDATE DONGOIMON SET TrangThai = N'Đã thanh toán' WHERE ID = @ID_Don;

        DECLARE @ID_Ban INT;
        SELECT @ID_Ban = ID_Ban FROM DONGOIMON WHERE ID = @ID_Don;
        IF @ID_Ban IS NOT NULL
            UPDATE BAN SET TrangThai = N'Trống' WHERE ID_Ban = @ID_Ban;

        COMMIT TRANSACTION;
        SELECT N'Thanh toán hoàn tất, đã giải phóng bàn!' AS Message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Msg2 NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg2, 16, 1);
    END CATCH
END;
GO