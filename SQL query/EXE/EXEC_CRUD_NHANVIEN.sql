--========================================
--  EXEC thêm nhân viên
--========================================

-- EXEC sp_ThemNhanVien 
--     @CCCD = '001099123456', 
--     @HoTen = N'Nguyễn Thị Test Lễ Tân', 
--     @Username = 'reception_test', -- Username mới
--     @Password = '123456',
--     @NgaySinh = '2000-05-20', 
--     @NgayVaoLam = '2024-01-01', 
--     @Luong = 7000000, 
--     @DiaChi = N'Tân Bình, HCM', 
--     @ChucDanh = N'Lễ tân', 
--     @LoaiHinhLamViec = N'Fulltime',
--     @SDT_Chinh = '0999888777', 
--     @NgoaiNgu = N'Tiếng Hàn, Tiếng Nhật'; -- Thông tin riêng

-- -- [VERIFY] Kiểm tra kết quả
-- SELECT * FROM NHANVIEN WHERE CCCD = '001099123456'; -- Kiểm tra bảng cha
-- SELECT * FROM LETAN WHERE ID = (SELECT ID FROM NHANVIEN WHERE CCCD = '001099123456'); -- Kiểm tra bảng con
-- SELECT * FROM SDT_NHANVIEN WHERE SDT = '0999888777'; -- Kiểm tra SĐT


--========================================
--  EXEC cập nhật nhân viên
--========================================

-- SELECT * FROM NHANVIEN WHERE ID = 15;
-- SELECT * FROM PHUCVU WHERE ID = 15;

-- -- [EXECUTE] Cập nhật: Đổi tên, Tăng lương, Đổi chức danh sang Quản lý kho
-- EXEC sp_CapNhatNhanVien 
--     @ID = 15,
--     @HoTen = N'Cao Văn Quản Kho', 
--     @Luong = 28000000,
--     @ChucDanhMoi = N'Quản lý kho', -- Đổi chức danh
--     @NhomNguyenLieu = N'Thực phẩm đông lạnh'; -- Optional

-- -- [VERIFY] Kiểm tra kết quả
-- -- 1. Bảng cha: Tên, Lương, Chức danh phải đổi
-- SELECT * FROM NHANVIEN WHERE ID = 15;
-- -- 2. Bảng con cũ (PHUCVU): Phải trống (bị xóa)
-- SELECT * FROM PHUCVU WHERE ID = 15;
-- -- 3. Bảng con mới (QUANLYKHO): Phải có dữ liệu
-- SELECT * FROM QUANLYKHO WHERE ID = 15;

-- -- [CLEANUP] Hoàn tác (Đổi lại như cũ để không hỏng dữ liệu mẫu)
-- -- Đổi lại thành Phục vụ
-- EXEC sp_CapNhatNhanVien 
--     @ID = 15,
--     @HoTen = N'Cao Văn Phục Vụ', 
--     @Luong = 26000000,
--     @ChucDanhMoi = N'Phục vụ',
--     @CaLamViec = N'Tối'; -- Trả lại thông tin cũ


--========================================
--  EXEC xóa nhân viên
--========================================

-- -- [EXECUTE] Xóa mềm nhân viên ID 14
-- EXEC sp_XoaNhanVien @ID = 14;

-- -- [VERIFY] Kiểm tra kết quả
-- -- NgayNghiViec phải NOT NULL (bằng ngày hôm nay)
-- SELECT ID, HoTen, NgayNghiViec FROM NHANVIEN WHERE ID = 14;

-- -- [CLEANUP] Khôi phục (Vì là xóa mềm nên chỉ cần update lại NULL)
-- UPDATE NHANVIEN SET NgayNghiViec = NULL WHERE ID = 14;


--=============================================================
--  EXEC THỐNG KÊ TỔNG ĐƠN CỦA TỪNG NHÂN VIÊN THEO THÁNG
--=============================================================
-- [EXECUTE] Tìm nhân viên phục vụ có doanh thu > 100k
-- EXEC sp_ThongKeHieuSuatPhucVu 
--     @Thang = 11, 
--     @Nam = 2023, 
--     @DoanhThuSan = 100000;

-- [VERIFY] Kết quả mong đợi:
-- Dựa trên dữ liệu mẫu: 
-- ID 12 (Hồ Thị Phục Vụ 5) có đơn ID=5 (800k) -> Sẽ hiện.
-- ID 8, 9, 10, 11 cũng có đơn -> Sẽ hiện và sắp xếp giảm dần.