USE DB_RESTAURANT
GO

-- ===============================================================
-- THỦ TỤC MỚI: TẠO VÀ LƯU BÁO CÁO DOANH THU ĐỊNH KỲ
-- Mục đích: Đáp ứng yêu cầu của bảng BAOCAODOANHTHU
-- Logic: 
--   1. Tính Tổng Doanh Thu (từ THANHTOAN)
--   2. Tính Tổng Chi Phí (Nhập hàng + Lương nhân viên)
--   3. Lưu vào bảng BAOCAODOANHTHU
-- ===============================================================

IF OBJECT_ID('dbo.sp_TaoVaLuuBaoCao', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_TaoVaLuuBaoCao;
GO

CREATE PROCEDURE dbo.sp_TaoVaLuuBaoCao (
    @LoaiBaoCao NVARCHAR(10), -- 'Tháng', 'Quý', 'Năm'
    @Ky INT,                  -- Ví dụ: Tháng 11, Quý 4
    @Nam INT                  -- Ví dụ: 2023
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- BẮT ĐẦU GIAO DỊCH
        BEGIN TRANSACTION;

        DECLARE @TuNgay DATE;
        DECLARE @DenNgay DATE;
    
        -- 1. XÁC ĐỊNH KHOẢNG THỜI GIAN (TỪ NGÀY - ĐẾN NGÀY)
        IF @LoaiBaoCao = N'Tháng'
        BEGIN
            IF @Ky < 1 OR @Ky > 12 THROW 50001, N'Lỗi: Tháng phải từ 1 đến 12.', 1;
            SET @TuNgay = DATEFROMPARTS(@Nam, @Ky, 1);
            SET @DenNgay = EOMONTH(@TuNgay);
        END
        ELSE IF @LoaiBaoCao = N'Quý'
        BEGIN
            IF @Ky < 1 OR @Ky > 4 THROW 50002, N'Lỗi: Quý phải từ 1 đến 4.', 1;
            SET @TuNgay = DATEFROMPARTS(@Nam, (@Ky - 1) * 3 + 1, 1);
            SET @DenNgay = EOMONTH(DATEADD(MONTH, 2, @TuNgay));
        END
        ELSE IF @LoaiBaoCao = N'Năm'
        BEGIN
             -- Với năm, tham số Kỳ có thể là chính năm đó hoặc bỏ qua, ở đây ta dùng @Nam
            SET @Ky = @Nam;
            SET @TuNgay = DATEFROMPARTS(@Nam, 1, 1);
            SET @DenNgay = DATEFROMPARTS(@Nam, 12, 31);
        END
        ELSE
        BEGIN
            THROW 50003, N'Lỗi: Loại báo cáo không hợp lệ (Chỉ nhận Tháng/Quý/Năm)', 1;
        END

        -- Kiểm tra báo cáo đã tồn tại chưa (Tránh trùng lặp - Unique Constraint)
        IF EXISTS (SELECT 1 FROM BAOCAODOANHTHU WHERE LoaiBaoCao = @LoaiBaoCao AND Ky = @Ky AND Nam = @Nam)
        BEGIN
            DELETE FROM BAOCAODOANHTHU WHERE LoaiBaoCao = @LoaiBaoCao AND Ky = @Ky AND Nam = @Nam;
        END

        -- 2. TÍNH TOÁN SỐ LIỆU
        DECLARE @TongDoanhThu DECIMAL(18, 0) = 0;
        DECLARE @TongChiPhi DECIMAL(18, 0) = 0;
        DECLARE @ChiPhiNguyenLieu DECIMAL(18, 0) = 0;
        DECLARE @ChiPhiLuong DECIMAL(18, 0) = 0;

        -- A. Tính Doanh Thu (Từ những đơn đã thanh toán trong kỳ)
        SELECT @TongDoanhThu = ISNULL(SUM(ThanhTien), 0)
        FROM THANHTOAN
        WHERE CONVERT(DATE, ThoiGianThanhToan) BETWEEN @TuNgay AND @DenNgay;

        -- B. Tính Chi Phí 1: Nhập Nguyên Liệu (Từ bảng CUNGCAP)
        SELECT @ChiPhiNguyenLieu = ISNULL(SUM(TongTien), 0)
        FROM CUNGCAP
        WHERE ThoiGian BETWEEN @TuNgay AND @DenNgay;

        -- C. Tính Chi Phí 2: Lương Nhân Viên (Giả định tính cho 1 tháng/quý/năm)
        -- Lấy tổng lương cơ bản hiện tại của toàn bộ nhân viên
        DECLARE @TongLuongCoBan DECIMAL(18, 0);
        SELECT @TongLuongCoBan = ISNULL(SUM(Luong), 0) FROM NHANVIEN WHERE NgayNghiViec IS NULL;

        -- Nhân hệ số thời gian (Tháng = 1, Quý = 3, Năm = 12)
        IF @LoaiBaoCao = N'Tháng' SET @ChiPhiLuong = @TongLuongCoBan * 1;
        IF @LoaiBaoCao = N'Quý'   SET @ChiPhiLuong = @TongLuongCoBan * 3;
        IF @LoaiBaoCao = N'Năm'   SET @ChiPhiLuong = @TongLuongCoBan * 12;

        -- Tổng Chi Phí
        SET @TongChiPhi = @ChiPhiNguyenLieu + @ChiPhiLuong;

        -- 3. LƯU VÀO BẢNG (INSERT)
        INSERT INTO BAOCAODOANHTHU (ThoiGianLap, LoaiBaoCao, Ky, Nam, TongDoanhThu, TongChiPhi)
        VALUES (SYSUTCDATETIME(), @LoaiBaoCao, @Ky, @Nam, @TongDoanhThu, @TongChiPhi);

        COMMIT TRANSACTION;
        -- 4. HIỂN THỊ KẾT QUẢ VỪA TẠO
        PRINT N'Đã tạo báo cáo thành công!';
        -- For backend use
        SELECT 
        N'Đã tạo báo cáo thành công!' AS Message,
        * FROM BAOCAODOANHTHU 
        WHERE LoaiBaoCao = @LoaiBaoCao AND Ky = @Ky AND Nam = @Nam;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO
