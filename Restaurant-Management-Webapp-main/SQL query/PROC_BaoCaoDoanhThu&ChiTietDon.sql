USE DB_RESTAURANT
GO

-- ===============================================================
-- T-SQL Stored Procedure: dbo.sp_BaoCaoDoanhThu_ChiTietDon
-- Phiên bản: V2 - Hỗ trợ báo cáo theo Ngày, Tuần, Tháng, Quý, Năm
-- ===============================================================

IF OBJECT_ID('dbo.sp_BaoCaoDoanhThu_ChiTietDon', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_BaoCaoDoanhThu_ChiTietDon;
GO

CREATE PROCEDURE dbo.sp_BaoCaoDoanhThu_ChiTietDon (
    @ID_Don INT = NULL, 
    @LoaiBaoCao NVARCHAR(10) = N'Tháng', -- 'Ngày', 'Tuần', 'Tháng', 'Quý', 'Năm'
    @NgayBatDau DATE = NULL,
    @NgayKetThuc DATE = NULL,
    @TongDoanhThuToiThieu DECIMAL(18, 0) = 0
)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
    -- ===============================================================
    -- TRƯỜNG HỢP 1: XEM CHI TIẾT ĐƠN HÀNG
    -- ===============================================================
        IF @ID_Don IS NOT NULL
        BEGIN

            PRINT N'--- [CHẾ ĐỘ 1] Chi tiết Món ăn trong Đơn gọi món ID: ' + CAST(@ID_Don AS NVARCHAR(10)) + ' ---';
            -- Validate đơn hàng
            IF NOT EXISTS (SELECT 1 FROM DONGOIMON WHERE ID = @ID_Don)
                BEGIN
                    RAISERROR(N'Lỗi: Không tìm thấy Đơn gọi món với ID: %d', 16, 1, @ID_Don);
                    RETURN;
                END

            SELECT
                DGM.ID AS N'Mã Đơn',
                LGM.ID AS N'Mã Lần Gọi',
                LGM.ThoiDiemGoi AS N'Thời Điểm Gọi',
                MA.Ten AS N'Tên Món Ăn',
                LMM.SoLuong AS N'Số Lượng',
                LMM.DonGiaThoiDiem AS N'Đơn Giá Lúc Gọi',
                LMM.ThanhTien AS N'Thành Tiền',
                LGM.TrangThai AS N'Trạng Thái Món'
            FROM 
                DONGOIMON DGM
            -- Strategy gì mà chọn INNER JOIN?
            INNER JOIN 
                LANGOIMON LGM ON DGM.ID = LGM.ID_Don
            INNER JOIN 
                LANGOIMON_MON LMM ON LGM.ID = LMM.ID_LanGoi
            INNER JOIN 
                MONAN MA ON LMM.ID_MonAn = MA.ID
            WHERE 
                DGM.ID = @ID_Don
            ORDER BY 
                LGM.ThoiDiemGoi ASC, MA.Ten ASC;
        END
    -- ===============================================================
    -- TRƯỜNG HỢP 2: XEM BÁO CÁO DOANH THU (Đa dạng kỳ)
    -- ===============================================================
        ELSE
        BEGIN
            PRINT N'--- [CHẾ ĐỘ 2] Báo cáo Doanh thu theo: ' + @LoaiBaoCao + N' (Từ ' + ISNULL(CONVERT(NVARCHAR, @NgayBatDau, 103), N'Bắt đầu') + N' đến ' + ISNULL(CONVERT(NVARCHAR, @NgayKetThuc, 103), N'Hiện tại') + N') ---';

            -- Validate Loại Báo Cáo
            IF @LoaiBaoCao NOT IN (N'Ngày', N'Tuần', N'Tháng', N'Quý', N'Năm')
            BEGIN
                RAISERROR(N'Lỗi: Loại báo cáo "%s" không hợp lệ. Chỉ chấp nhận: Ngày, Tuần, Tháng, Quý, Năm.', 16, 1, @LoaiBaoCao);
                RETURN;
            END

            -- Validate Ngày tháng
            IF @NgayBatDau IS NOT NULL AND @NgayKetThuc IS NOT NULL AND @NgayBatDau > @NgayKetThuc
            BEGIN
                RAISERROR(N'Lỗi: Ngày bắt đầu không được lớn hơn ngày kết thúc.', 16, 1);
                RETURN;
            END

            -- Biểu thức tính Kỳ báo cáo mở rộng
            DECLARE @KyBaoCaoExpression NVARCHAR(MAX);
            SET @KyBaoCaoExpression = CASE @LoaiBaoCao
                -- Báo cáo theo NGÀY: "2023-11-08"
                WHEN N'Ngày'  THEN N'CONVERT(NVARCHAR(10), TT.ThoiGianThanhToan, 103)' 
            
                -- Báo cáo theo TUẦN: "2023-Tuần 45"
                WHEN N'Tuần'  THEN N'CONVERT(NVARCHAR(4), YEAR(TT.ThoiGianThanhToan)) + N''-Tuần '' + CAST(DATEPART(wk, TT.ThoiGianThanhToan) AS NVARCHAR(2))'
            
                -- Báo cáo theo THÁNG: "2023-Tháng 11"
                WHEN N'Tháng' THEN N'CONVERT(NVARCHAR(4), YEAR(TT.ThoiGianThanhToan)) + N''-Tháng '' + RIGHT(''0'' + CAST(MONTH(TT.ThoiGianThanhToan) AS NVARCHAR(2)), 2)'
            
                -- Báo cáo theo QUÝ: "2023-Quý 4"
                WHEN N'Quý'   THEN N'CONVERT(NVARCHAR(4), YEAR(TT.ThoiGianThanhToan)) + N''-Quý '' + CAST(DATEPART(qq, TT.ThoiGianThanhToan) AS NVARCHAR(1))'
            
                -- Báo cáo theo NĂM: "2023"
                WHEN N'Năm'   THEN N'CAST(YEAR(TT.ThoiGianThanhToan) AS NVARCHAR(4))'
            
                ELSE N'''Không xác định'''
            END;

            -- Dynamic SQL
            DECLARE @SQL NVARCHAR(MAX);
            SET @SQL = N'
                SELECT
                    ' + @KyBaoCaoExpression + N' AS [Kỳ Báo Cáo],
                    COUNT(TT.ID) AS [Số Lượng Hóa Đơn],
                    SUM(TT.ThanhTien) AS [Tổng Doanh Thu (Sau Giảm)],
                    CAST(AVG(TT.ThanhTien) AS DECIMAL(18,2)) AS [Doanh Thu TB / Hóa Đơn]
                FROM 
                    THANHTOAN TT
                INNER JOIN 
                    DONGOIMON DGM ON TT.ID_Don = DGM.ID 
                WHERE 
                    (@NgayBatDau IS NULL OR CONVERT(DATE, TT.ThoiGianThanhToan) >= @NgayBatDau)
                    AND (@NgayKetThuc IS NULL OR CONVERT(DATE, TT.ThoiGianThanhToan) <= @NgayKetThuc)
                GROUP BY 
                    ' + @KyBaoCaoExpression + N'
                HAVING
                    SUM(TT.ThanhTien) >= @TongDoanhThuToiThieu
                ORDER BY 
                    [Tổng Doanh Thu (Sau Giảm)] DESC;
            ';

            EXEC sp_executesql @SQL,
                N'@NgayBatDau DATE, @NgayKetThuc DATE, @TongDoanhThuToiThieu DECIMAL(18, 0)',
                @NgayBatDau, @NgayKetThuc, @TongDoanhThuToiThieu;
        END
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16,1);
    END CATCH
END
GO

