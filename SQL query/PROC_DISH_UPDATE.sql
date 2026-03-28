CREATE PROCEDURE sp_ThemMonAn
    @Ten            NVARCHAR(100),
    @DonGia         DECIMAL(12,0),
    @PhanLoai       NVARCHAR(10),   -- 'Mặn' hoặc 'Chay'
    @MoTa           NVARCHAR(500) = NULL,
    @DangPhucVu     BIT = 1,        -- Mặc định là đang bán
    @DangKinhDoanh  BIT = 1         -- Mặc định là còn kinh doanh
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Validate Tên món (Không được để trống)
        IF @Ten IS NULL OR LTRIM(RTRIM(@Ten)) = ''
            THROW 50001, N'Lỗi: Tên món ăn không được để trống.', 1;

        -- 2. Validate Trùng tên món
        IF EXISTS (SELECT 1 FROM MONAN WHERE Ten = @Ten)
            THROW 50002, N'Lỗi: Tên món ăn này đã tồn tại trong thực đơn.', 1;

        -- 3. Validate Đơn giá
        IF @DonGia <= 0
            THROW 50003, N'Lỗi: Đơn giá phải lớn hơn 0.', 1;

        -- 4. Validate Phân loại (Chỉ chấp nhận Mặn/Chay - khớp với CHECK constraint trong DB)
        IF @PhanLoai NOT IN (N'Mặn', N'Chay')
            THROW 50004, N'Lỗi: Phân loại món ăn không hợp lệ (Phải là Mặn hoặc Chay).', 1;

        -- Thêm mới
        INSERT INTO MONAN (Ten, PhanLoai, MoTa, DonGia, DangPhucVu, DangKinhDoanh)
        VALUES (@Ten, @PhanLoai, @MoTa, @DonGia, @DangPhucVu, @DangKinhDoanh);

        -- Lấy ID vừa tạo
        DECLARE @NewID INT = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        -- Trả về thông báo thành công
        SELECT N'Đã thêm món "' + @Ten + N'" vào thực đơn thành công.' AS Message, @NewID AS ID;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR (@ErrorMessage, 16, 1);
    END CATCH
END;
GO
CREATE PROCEDURE sp_XoaMonAn
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Kiểm tra tồn tại
        IF NOT EXISTS (SELECT 1 FROM MONAN WHERE ID = @ID)
            THROW 50001, N'Lỗi: Món ăn không tồn tại.', 1;

        -- 2. Kiểm tra xem món này đã từng được bán chưa?
        -- Nếu chưa từng bán (không có trong LANGOIMON_MON), ta có thể XÓA CỨNG cho sạch DB.
        IF NOT EXISTS (SELECT 1 FROM LANGOIMON_MON WHERE ID_MonAn = @ID)
        BEGIN
            DELETE FROM MONAN WHERE ID = @ID;
            COMMIT TRANSACTION;
            SELECT N'Đã xóa hoàn toàn món ăn khỏi hệ thống (do chưa phát sinh giao dịch).' AS Message;
            RETURN;
        END

        -- 3. Nếu đã từng bán, thực hiện XÓA MỀM (Ngừng kinh doanh)
        UPDATE MONAN 
        SET DangKinhDoanh = 0, DangPhucVu = 0 
        WHERE ID = @ID;

        COMMIT TRANSACTION;
        SELECT N'Đã ngừng kinh doanh món ăn này (Dữ liệu lịch sử vẫn được giữ lại).' AS Message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR (@ErrorMessage, 16, 1);
    END CATCH
END;
GO
CREATE PROCEDURE sp_CapNhatMonAn
    @ID             INT,
    @Ten            NVARCHAR(100) = NULL,
    @DonGia         DECIMAL(12,0) = NULL,
    @PhanLoai       NVARCHAR(10) = NULL,
    @MoTa           NVARCHAR(500) = NULL,
    @DangPhucVu     BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Kiểm tra tồn tại
        IF NOT EXISTS (SELECT 1 FROM MONAN WHERE ID = @ID)
            THROW 50001, N'Lỗi: Món ăn không tồn tại.', 1;

        -- 2. Validate Tên (Nếu có update tên -> check trùng)
        IF @Ten IS NOT NULL 
        BEGIN
            IF EXISTS (SELECT 1 FROM MONAN WHERE Ten = @Ten AND ID <> @ID)
                THROW 50002, N'Lỗi: Tên món ăn mới bị trùng với một món khác.', 1;
        END

        -- 3. Validate Giá
        IF @DonGia IS NOT NULL AND @DonGia <= 0
            THROW 50003, N'Lỗi: Đơn giá phải lớn hơn 0.', 1;

        -- Update
        UPDATE MONAN
        SET 
            Ten = ISNULL(@Ten, Ten),
            DonGia = ISNULL(@DonGia, DonGia),
            PhanLoai = ISNULL(@PhanLoai, PhanLoai),
            MoTa = ISNULL(@MoTa, MoTa),
            DangPhucVu = ISNULL(@DangPhucVu, DangPhucVu)
        WHERE ID = @ID;

        COMMIT TRANSACTION;
        SELECT N'Cập nhật món ăn thành công.' AS Message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR (@ErrorMessage, 16, 1);
    END CATCH
END;
GO

USE DB_RESTAURANT;
GO

-- 1. Procedure: Bếp trưởng gửi yêu cầu cập nhật thực đơn
CREATE OR ALTER PROCEDURE sp_GuiYeuCauCapNhat
    @ID_BepTruong   INT,
    @LoaiYeuCau     NVARCHAR(10), -- 'Thêm', 'Sửa', 'Xóa'
    @ID_MonAn       INT = NULL,   -- NULL nếu là 'Thêm'
    @TenMon         NVARCHAR(100) = NULL,
    @DonGia         DECIMAL(12,0) = NULL,
    @MoTa           NVARCHAR(500) = NULL,
    @PhanLoai       NVARCHAR(10) = NULL,
    @LyDo           NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validate cơ bản
        IF @LoaiYeuCau NOT IN (N'Thêm', N'Sửa', N'Xóa')
            THROW 50001, N'Lỗi: Loại yêu cầu không hợp lệ.', 1;

        IF @LoaiYeuCau IN (N'Sửa', N'Xóa') AND @ID_MonAn IS NULL
            THROW 50002, N'Lỗi: Phải chọn món ăn để Sửa hoặc Xóa.', 1;

        -- Insert vào bảng CAPNHAT_MONAN
        INSERT INTO CAPNHAT_MONAN (
            ID_BepTruong, ID_MonAn, LoaiYeuCau, TrangThai, 
            TenMon_DeXuat, DonGia_DeXuat, MoTa_DeXuat, PhanLoai_DeXuat, LyDo
        )
        VALUES (
            @ID_BepTruong, @ID_MonAn, @LoaiYeuCau, N'Chờ duyệt',
            @TenMon, @DonGia, @MoTa, @PhanLoai, @LyDo
        );

        COMMIT TRANSACTION;
        SELECT N'Đã gửi yêu cầu "' + @LoaiYeuCau + N'" thành công. Vui lòng chờ Quản lý duyệt.' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW; -- Ném lỗi nguyên bản ra ngoài
    END CATCH
END;
GO

-- 2. Procedure: Quản lý duyệt hoặc từ chối yêu cầu
CREATE OR ALTER PROCEDURE sp_DuyetYeuCauCapNhat
    @ID_YeuCau  INT,
    @ID_QuanLy  INT,
    @TrangThai  NVARCHAR(20) -- 'Đã duyệt' hoặc 'Từ chối'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Kiểm tra tồn tại yêu cầu
        DECLARE @LoaiYeuCau NVARCHAR(10), @ID_MonAn INT;
        DECLARE @Ten NVARCHAR(100), @Gia DECIMAL(12,0), @MoTa NVARCHAR(500), @PhanLoai NVARCHAR(10);

        SELECT 
            @LoaiYeuCau = LoaiYeuCau, 
            @ID_MonAn = ID_MonAn,
            @Ten = TenMon_DeXuat,
            @Gia = DonGia_DeXuat,
            @MoTa = MoTa_DeXuat,
            @PhanLoai = PhanLoai_DeXuat
        FROM CAPNHAT_MONAN 
        WHERE ID = @ID_YeuCau AND TrangThai = N'Chờ duyệt';

        IF @LoaiYeuCau IS NULL
            THROW 50003, N'Lỗi: Yêu cầu không tồn tại hoặc đã được xử lý trước đó.', 1;

        -- Cập nhật trạng thái yêu cầu
        UPDATE CAPNHAT_MONAN
        SET TrangThai = @TrangThai, 
            ID_QuanLy = @ID_QuanLy, 
            ThoiGianDuyet = SYSUTCDATETIME()
        WHERE ID = @ID_YeuCau;

        -- NẾU LÀ TỪ CHỐI -> Kết thúc luôn
        IF @TrangThai = N'Từ chối'
        BEGIN
            COMMIT TRANSACTION;
            SELECT N'Đã từ chối yêu cầu thành công.' AS Message;
            RETURN;
        END

        -- NẾU LÀ DUYỆT -> Thực hiện thay đổi vào bảng MONAN
        IF @LoaiYeuCau = N'Thêm'
        BEGIN
            INSERT INTO MONAN (Ten, DonGia, PhanLoai, MoTa, DangPhucVu, DangKinhDoanh)
            VALUES (@Ten, @Gia, @PhanLoai, @MoTa, 1, 1);
        END
        ELSE IF @LoaiYeuCau = N'Sửa'
        BEGIN
            UPDATE MONAN
            SET Ten = ISNULL(@Ten, Ten),
                DonGia = ISNULL(@Gia, DonGia),
                PhanLoai = ISNULL(@PhanLoai, PhanLoai),
                MoTa = ISNULL(@MoTa, MoTa)
            WHERE ID = @ID_MonAn;
        END
        ELSE IF @LoaiYeuCau = N'Xóa'
        BEGIN
            -- Xóa mềm (Ngừng kinh doanh)
            UPDATE MONAN SET DangKinhDoanh = 0 WHERE ID = @ID_MonAn;
        END

        COMMIT TRANSACTION;
        SELECT N'Đã duyệt yêu cầu và cập nhật thực đơn thành công.' AS Message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO