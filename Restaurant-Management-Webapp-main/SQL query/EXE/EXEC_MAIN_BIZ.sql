USE DB_RESTAURANT
GO

PRINT '=== BẮT ĐẦU KỊCH BẢN TEST: KHÁCH ANH NAM ===';

-- KHAI BÁO BIẾN ĐỂ LƯU CÁC ID SINH RA TRONG QUÁ TRÌNH CHẠY
DECLARE @My_ID_DatBan INT;
DECLARE @My_ID_Ban INT;
DECLARE @My_ID_Don INT;
DECLARE @My_ID_LanGoi_1 INT;
DECLARE @My_ID_LanGoi_2 INT;

-- ======================================================================================
-- BƯỚC 1: ĐẶT BÀN (Booking)
-- ======================================================================================
PRINT '--- 1. Đặt bàn ---';

-- Giả định: Khách đặt bàn cho 4 người, đến sau 2 tiếng nữa
DECLARE @ThoiGianDen DATETIME2 = DATEADD(HOUR, 2, GETUTCDATE());

EXEC sp_TaoDatBan 
    @SDT_Khach      = '0999888777', 
    @TenKhach       = N'Anh Nam', 
    @SoLuongKhach   = 4, 
    @ThoiGianDat    = @ThoiGianDen, 
    @ID_LeTan       = 5,
    @GhiChu         = N'Khách VIP, xếp bàn yên tĩnh';

-- [SYSTEM] Lấy lại ID vừa tạo để dùng cho bước sau (Trong App thì API sẽ trả về)
SELECT TOP(1) @My_ID_DatBan = ID_DatBan, @My_ID_Ban = ID_Ban 
FROM DATBAN WHERE SDT_Khach = '0999888777' ORDER BY ID_DatBan DESC;

PRINT N'=> Đã tạo phiếu đặt ID: ' + CAST(@My_ID_DatBan AS NVARCHAR(10)) + N' tại Bàn: ' + CAST(@My_ID_Ban AS NVARCHAR(10));


-- ======================================================================================
-- BƯỚC 2: NHẬN BÀN (Check-in)
-- ======================================================================================
PRINT '--- 2. Khách đến & Nhận bàn ---';

-- Giả định: Khách đến đúng giờ
EXEC sp_NhanBan 
    @ID_DatBan      = @My_ID_DatBan, 
    @ID_LeTan       = 5,
    @ID_PhucVu      = 10;

-- [SYSTEM] Tìm Đơn Gọi Món vừa được hệ thống tự động tạo ra
SELECT @My_ID_Don = ID 
FROM DONGOIMON 
WHERE ID_Ban = @My_ID_Ban AND TrangThai = N'Đang phục vụ';

PRINT N'=> Khách đã vào bàn. Mã Đơn hàng (Order ID): ' + CAST(@My_ID_Don AS NVARCHAR(10));


-- ======================================================================================
-- BƯỚC 3: GỌI MÓN ĐỢT 1 (Ordering Round 1)
-- ======================================================================================
PRINT '--- 3. Gọi món Đợt 1 (Phở, Cơm Tấm & Trà đá) ---';

-- 3.1 Tạo Lần gọi
-- Lưu ý: sp_TaoLanGoiMon trả về 1 bảng kết quả chứa ID, ta dùng biến bảng hoặc giả lập lấy ID
EXEC sp_TaoLanGoiMon @ID_Don = @My_ID_Don, @GhiChu = N'Làm nhanh giúp em';

-- [SYSTEM] Lấy ID lần gọi vừa tạo
SELECT TOP(1) @My_ID_LanGoi_1 = ID FROM LANGOIMON WHERE ID_Don = @My_ID_Don ORDER BY ID DESC;
PRINT N'=> Mã Lần gọi 1: ' + CAST(@My_ID_LanGoi_1 AS NVARCHAR(10));

-- 3.2 Thêm món vào lần gọi
-- Món 1: Phở Bò (ID=1), Số lượng 2
EXEC sp_ThemMonVaoLanGoi @ID_LanGoi = @My_ID_LanGoi_1, @ID_MonAn = 1, @SoLuong = 2;

-- Món 2: Cơm Tấm Sườn Bì (ID=2), Số lượng 2
EXEC sp_ThemMonVaoLanGoi @ID_LanGoi = @My_ID_LanGoi_1, @ID_MonAn = 2, @SoLuong = 2;

-- Món 2: Trà Đá (ID=15), Số lượng 4
EXEC sp_ThemMonVaoLanGoi @ID_LanGoi = @My_ID_LanGoi_1, @ID_MonAn = 15, @SoLuong = 4;


-- ======================================================================================
-- BƯỚC 4: BẾP & PHỤC VỤ (Operation)
-- ======================================================================================
PRINT '--- 4. Bếp nấu & Trả món ---';

-- 4.1 Bếp trưởng (ID=2) xác nhận nấu xong
EXEC sp_CapNhatTrangThaiLanGoi 
    @ID_LanGoi = @My_ID_LanGoi_1, 
    @TrangThaiMoi = N'Sẵn sàng phục vụ', 
    @ID_NhanVien = 2; -- ID của ông Chef

-- 4.2 Phục vụ (ID=8 - Bùi Thị Phục Vụ) bưng ra
EXEC sp_CapNhatTrangThaiLanGoi 
    @ID_LanGoi = @My_ID_LanGoi_1, 
    @TrangThaiMoi = N'Đã phục vụ', 
    @ID_NhanVien = 8;


-- ======================================================================================
-- BƯỚC 5: GỌI MÓN ĐỢT 2 (Ordering Round 2 - Gọi thêm)
-- ======================================================================================
PRINT '--- 5. Gọi món Đợt 2 (Gọi thêm Gỏi cuốn) ---';

-- 5.1 Tạo Lần gọi mới
EXEC sp_TaoLanGoiMon @ID_Don = @My_ID_Don, @GhiChu = N'Ăn thêm';
SELECT TOP(1) @My_ID_LanGoi_2 = ID FROM LANGOIMON WHERE ID_Don = @My_ID_Don ORDER BY ID DESC;

-- 5.2 Thêm món: Gỏi Cuốn (ID=4), Số lượng 1
EXEC sp_ThemMonVaoLanGoi @ID_LanGoi = @My_ID_LanGoi_2, @ID_MonAn = 4, @SoLuong = 1;

-- (Giả sử đợt này món lạnh không cần bếp nấu, phục vụ bưng ra luôn)
EXEC sp_CapNhatTrangThaiLanGoi @ID_LanGoi = @My_ID_LanGoi_2, @TrangThaiMoi = N'Đã phục vụ', @ID_NhanVien = 8;


-- ======================================================================================
-- BƯỚC 6: THANH TOÁN (Payment)
-- ======================================================================================
PRINT '--- 6. Thanh toán ---';

-- Khách có Voucher giảm giá 20.000 VNĐ
-- Thanh toán bằng Thẻ
EXEC sp_ThanhToan 
    @ID_Don             = @My_ID_Don, 
    @ID_LeTan           = 6, 
    @PhuongThuc         = N'Thẻ', 
    @GiamGiaTheoLuong   = 20000,
    @SDT_Khach          = '0999888777'; -- Tích điểm cho khách mới này

PRINT '=== KẾT THÚC KỊCH BẢN ===';
GO


-- PRINT '--- DỌN DẸP DỮ LIỆU TEST ---';

-- DECLARE @SDT_Test VARCHAR(20) = '0999888777';

-- -- 1. Xóa Thanh toán
-- DELETE FROM THANHTOAN WHERE SDT_Khach = @SDT_Test;

-- -- 2. Tìm ID Đơn của khách test để xóa chi tiết
-- DECLARE @ID_Don_Test INT;
-- SELECT @ID_Don_Test = ID FROM DONGOIMON 
-- WHERE ID_Ban IN (SELECT ID_Ban FROM DATBAN WHERE SDT_Khach = @SDT_Test);

-- -- Xóa Chi tiết gọi món & Lần gọi món
-- DELETE FROM LANGOIMON_MON WHERE ID_LanGoi IN (SELECT ID FROM LANGOIMON WHERE ID_Don = @ID_Don_Test);
-- DELETE FROM LANGOIMON WHERE ID_Don = @ID_Don_Test;

-- -- 3. Xóa Đơn gọi món
-- DELETE FROM DONGOIMON WHERE ID = @ID_Don_Test;

-- -- 4. Xóa Đặt bàn
-- DELETE FROM DATBAN WHERE SDT_Khach = @SDT_Test;

-- -- 5. Xóa Khách hàng
-- DELETE FROM KHACHHANG WHERE SDT = @SDT_Test;

-- -- 6. Reset trạng thái bàn (Nếu lỡ bàn chưa được giải phóng)
-- UPDATE BAN SET TrangThai = N'Trống' WHERE TrangThai <> N'Trống' AND ID_Ban NOT IN (SELECT ID_Ban FROM DONGOIMON WHERE TrangThai = N'Đang phục vụ');

-- PRINT '--- ĐÃ DỌN DẸP XONG ---';