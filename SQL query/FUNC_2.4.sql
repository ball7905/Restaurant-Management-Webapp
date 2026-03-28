-- ===============================================================
-- T-SQL FUNCTION: dbo.TinhTongLuongTheoChucDanh
-- Tính tổng lương của tất cả nhân viên dựa trên Chức danh
-- ===============================================================
GO 
USE DB_RESTAURANT

IF OBJECT_ID('dbo.TinhTongLuongTheoChucDanh', 'FN') IS NOT NULL
    DROP FUNCTION dbo.TinhTongLuongTheoChucDanh;
GO

CREATE FUNCTION dbo.TinhTongLuongTheoChucDanh (
    @ChucDanh NVARCHAR(50) -- Tham số đầu vào: Chức danh cần tính tổng lương
)
RETURNS DECIMAL(18, 2) -- Trả về kiểu DECIMAL phù hợp với cột Luong
AS
BEGIN
    -- Biến lưu trữ tổng lương
    DECLARE @TongLuong DECIMAL(18, 2) = 0;
    
    -- Biến dùng cho con trỏ (lưu Lương của từng nhân viên)
    DECLARE @LuongNhanVien DECIMAL(12, 2);

    -- ===============================================================
    -- 1. KIỂM TRA THAM SỐ ĐẦU VÀO (Sử dụng IF)
    -- ===============================================================
    
    -- Kiểm tra chuỗi đầu vào có rỗng/NULL không
    IF @ChucDanh IS NULL OR LTRIM(RTRIM(@ChucDanh)) = ''
    BEGIN
        -- Trả về NULL nếu tham số đầu vào không hợp lệ
        RETURN NULL; 
    END

    -- Kiểm tra xem Chức danh có tồn tại nhân viên nào không (Lưu ý: Chỉ kiểm tra sự tồn tại trong dữ liệu hiện có)
    IF NOT EXISTS (SELECT 1 FROM NHANVIEN WHERE ChucDanh = @ChucDanh)
    BEGIN
        -- Trả về 0 nếu không tìm thấy nhân viên nào với chức danh này (không phải lỗi, chỉ là tổng bằng 0)
        RETURN 0; 
    END

    -- ===============================================================
    -- 2. SỬ DỤNG CON TRỎ VÀ LOOP (Tính toán)
    -- ===============================================================

    -- Khai báo con trỏ: Lấy cột Luong của nhân viên có chức danh tương ứng
    DECLARE NhanVien_Cursor CURSOR FOR
    SELECT Luong
    FROM NHANVIEN
    WHERE ChucDanh = @ChucDanh;

    -- Mở con trỏ
    OPEN NhanVien_Cursor;

    -- Lấy dòng dữ liệu đầu tiên
    FETCH NEXT FROM NhanVien_Cursor INTO @LuongNhanVien;

    -- Bắt đầu vòng lặp (LOOP: WHILE)
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Cộng dồn lương vào biến tổng
        SET @TongLuong = @TongLuong + ISNULL(@LuongNhanVien, 0);

        -- Lấy dòng dữ liệu tiếp theo
        FETCH NEXT FROM NhanVien_Cursor INTO @LuongNhanVien;
    END

    -- Đóng con trỏ và giải phóng
    CLOSE NhanVien_Cursor;
    DEALLOCATE NhanVien_Cursor;

    -- Trả về tổng lương đã tính
    RETURN @TongLuong;
END
GO

-- HÀM 2: TÍNH DOANH THU MÓN ĂN THEO KHOẢNG THỜI GIAN
-- Input: Mã món, Từ ngày, Đến ngày (Nếu NULL thì tính tất cả)
-- Output: Tổng tiền món đó mang lại trong khoảng thời gian.

IF OBJECT_ID('dbo.f_TinhDoanhThuMonAn', 'FN') IS NOT NULL
    DROP FUNCTION dbo.f_TinhDoanhThuMonAn;
GO

CREATE FUNCTION dbo.f_TinhDoanhThuMonAn (
    @ID_MonAn INT,
    @TuNgay DATE = NULL,  -- Tham số mới
    @DenNgay DATE = NULL  -- Tham số mới
)
RETURNS DECIMAL(18, 2)
AS
BEGIN
    DECLARE @TongDoanhThu DECIMAL(18, 2) = 0;
    DECLARE @ThanhTienMotLan DECIMAL(18, 2);

    -- 1. Kiểm tra tồn tại món ăn
    IF NOT EXISTS (SELECT 1 FROM MONAN WHERE ID = @ID_MonAn)
    BEGIN
        RETURN 0;
    END

    -- 2. KHAI BÁO CON TRỎ (CURSOR) VỚI ĐIỀU KIỆN LỌC NGÀY
    DECLARE cur_DoanhThuMon CURSOR FOR
    SELECT LMM.ThanhTien
    FROM LANGOIMON_MON LMM
    INNER JOIN LANGOIMON LG ON LMM.ID_LanGoi = LG.ID
    INNER JOIN DONGOIMON D ON LG.ID_Don = D.ID
    INNER JOIN THANHTOAN TT ON D.ID = TT.ID_Don -- Join thêm bảng THANHTOAN để lấy ngày
    WHERE LMM.ID_MonAn = @ID_MonAn
      AND D.TrangThai = N'Đã thanh toán'
      -- Logic lọc ngày:
      AND (@TuNgay IS NULL OR CONVERT(DATE, TT.ThoiGianThanhToan) >= @TuNgay)
      AND (@DenNgay IS NULL OR CONVERT(DATE, TT.ThoiGianThanhToan) <= @DenNgay);

    OPEN cur_DoanhThuMon;
    FETCH NEXT FROM cur_DoanhThuMon INTO @ThanhTienMotLan;

    -- 3. VÒNG LẶP CỘNG DỒN
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @TongDoanhThu = @TongDoanhThu + ISNULL(@ThanhTienMotLan, 0);
        FETCH NEXT FROM cur_DoanhThuMon INTO @ThanhTienMotLan;
    END

    CLOSE cur_DoanhThuMon;
    DEALLOCATE cur_DoanhThuMon;

    RETURN @TongDoanhThu;
END
GO


