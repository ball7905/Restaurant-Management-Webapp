-- ========================================================
-- PROCEDURE THỐNG KÊ TỔNG ĐƠN CỦA TỪNG NHÂN VIÊN THEO THÁNG
-- ========================================================
GO
CREATE PROCEDURE sp_ThongKeHieuSuatPhucVu
    @Thang INT,
    @Nam INT,
    @DoanhThuSan    DECIMAL(18,0) -- Mức doanh thu tối thiểu để được hiển thị (KPI)
AS
BEGIN
    SET NOCOUNT ON;
    -- Truy vấn từ 2 bảng (NHANVIEN, DONGOIMON)
    SELECT 
        NV.ID,
        NV.HoTen,
        COUNT(D.ID) AS SoLuongDon, 
        SUM(TT.ThanhTien) AS TongDoanhThu,
        CAST(AVG(TT.ThanhTien) AS DECIMAL(10, 2)) AS DoanhThuTrungBinh
    FROM NHANVIEN NV
    JOIN DONGOIMON D ON NV.ID = D.ID_PhucVu 
    JOIN THANHTOAN TT ON D.ID = TT.ID_Don 
    WHERE MONTH(D.ThoiGianTao) = @Thang 
        AND YEAR(D.ThoiGianTao) = @Nam
        AND D.TrangThai = N'Đã thanh toán' 
        
    GROUP BY
        NV.ID, NV.HoTen
    HAVING 
        SUM(TT.ThanhTien) >= @DoanhThuSan 
    ORDER BY 
        TongDoanhThu DESC;
END;

-- ========================================================
-- PROCEDURE THỐNG KÊ THEO NGÀY TRÊN TRANG CHỦ QUẢN LÝ
-- ========================================================

GO
CREATE PROCEDURE sp_GetDailyStats
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Xác định khoảng thời gian cho "Hôm nay"
    DECLARE @StartOfDay DATETIME = CAST(CAST(GETUTCDATE() AS DATE) AS DATETIME); 
    DECLARE @EndOfDay   DATETIME = DATEADD(DAY, 1, @StartOfDay);

    -- 2. Khai báo biến để lưu kết quả
    DECLARE @Revenue DECIMAL(18, 2) = 0;
    DECLARE @Orders INT = 0;
    DECLARE @Customers INT = 0;

    -- 3. Tính Doanh thu (THANHTOAN)
    SELECT @Revenue = ISNULL(SUM(ThanhTien), 0)
    FROM THANHTOAN WITH(NOLOCK)
    WHERE ThoiGianThanhToan >= @StartOfDay 
      AND ThoiGianThanhToan < @EndOfDay;

    -- 4. Tính Số đơn gọi món (DONGOIMON)
    SELECT @Orders = COUNT(*)
    FROM DONGOIMON WITH(NOLOCK)
    WHERE ThoiGianTao >= @StartOfDay 
      AND ThoiGianTao < @EndOfDay;

    -- 5. Tính Số lượng khách (DATBAN) - Trừ trạng thái Hủy
    SELECT @Customers = ISNULL(SUM(SoLuongKhach), 0)
    FROM DATBAN WITH(NOLOCK)
    WHERE ThoiGianDat >= @StartOfDay 
      AND ThoiGianDat < @EndOfDay
      AND TrangThai != N'Đã hủy'; -- Dùng N'' để đảm bảo so sánh chuỗi Unicode chính xác

    SELECT 
        @Revenue AS revenueToday,
        @Orders AS ordersToday,
        @Customers AS customersToday;
END;