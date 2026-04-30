USE DB_RESTAURANT

-- [NEW] Đã thêm cột Username và Password
INSERT INTO NHANVIEN (CCCD, HoTen, Username, Password, NgaySinh, NgayVaoLam, Luong, DiaChi, ChucDanh, LoaiHinhLamViec, ID_GiamSat) VALUES
('079090000001', N'Nguyễn Văn Quản Lý', 'admin01', '123456', '1985-01-01', '2020-01-01', 25000000, N'Quận 1, HCM', N'Quản lý', N'Fulltime', NULL),
('079090000002', N'Trần Thị Bếp Trưởng', 'chef_head01', '123456', '1988-05-10', '2020-02-01', 20000000, N'Quận 3, HCM', N'Bếp trưởng', N'Fulltime', NULL),
('079090000003', N'Lê Văn Đầu Bếp', 'cook01', '123456', '1995-08-15', '2021-03-10', 12000000, N'Thủ Đức, HCM', N'Đầu bếp', N'Fulltime', 2),
('079090000004', N'Phạm Văn Đầu Bếp', 'cook02', '123456', '1996-12-20', '2021-04-01', 11000000, N'Gò Vấp, HCM', N'Đầu bếp', N'Fulltime', 2),
('079090000005', N'Hoàng Thị Lễ Tân', 'reception01', '123456', '2000-01-01', '2022-01-01', 8000000, N'Quận 10, HCM', N'Lễ tân', N'Fulltime', 1),
('079090000006', N'Vũ Thị Lễ Tân', 'reception02', '123456', '2001-02-14', '2022-06-01', 7500000, N'Quận 5, HCM', N'Lễ tân', N'Parttime', 1),
('079090000007', N'Đặng Văn Kho', 'warehouse01', '123456', '1990-11-11', '2020-05-05', 15000000, N'Bình Thạnh, HCM', N'Quản lý kho', N'Fulltime', 1),
('079090000008', N'Bùi Thị Phục Vụ', 'waiter01', '123456', '1999-09-09', '2023-01-01', 6000000, N'Quận 4, HCM', N'Phục vụ', N'Fulltime', 1),
('079090000009', N'Đỗ Văn Phục Vụ', 'waiter02', '123456', '1998-07-07', '2023-02-01', 6000000, N'Quận 7, HCM', N'Phục vụ', N'Fulltime', 1),
('079090000010', N'Lý Thị Phục Vụ', 'waiter03', '123456', '2002-03-03', '2023-03-01', 5500000, N'Quận 8, HCM', N'Phục vụ', N'Parttime', 1),
('079090000011', N'Ngô Văn Phục Vụ', 'waiter04', '123456', '2003-04-04', '2023-04-01', 5500000, N'Quận 12, HCM', N'Phục vụ', N'Parttime', 1),
('079090000012', N'Hồ Thị Phục Vụ', 'waiter05', '123456', '2000-10-10', '2023-05-01', 6000000, N'Tân Bình, HCM', N'Phục vụ', N'Fulltime', 1),
('079090000013', N'Dương Văn Bếp Phụ', 'cook03', '123456', '1997-06-06', '2022-08-01', 9000000, N'Bình Tân, HCM', N'Đầu bếp', N'Fulltime', 2),
('079090000014', N'Mai Thị Bếp Phụ', 'cook04', '123456', '1998-11-11', '2022-09-01', 9000000, N'Tân Phú, HCM', N'Đầu bếp', N'Fulltime', 2),
('079090000015', N'Cao Văn Phục Vụ', 'waiter06', '123456', '1986-12-12', '2019-01-01', 26000000, N'Quận 2, HCM', N'Phục Vụ', N'Fulltime', 12);

-- 2. SDT_NHANVIEN
INSERT INTO SDT_NHANVIEN (ID_NhanVien, SDT) VALUES
(1, '0901000001'), (2, '0902000002'), (3, '0903000003'), (4, '0904000004'), (5, '0905000005'),
(6, '0906000006'), (7, '0907000007'), (8, '0908000008'), (9, '0909000009'), (10, '0910000010'),
(11, '0911000011'), (12, '0912000012'), (13, '0913000013'), (14, '0914000014'), (15, '0915000015');

-- 3. INSERT VÀO CÁC BẢNG CON (Mapping theo ID ở trên)
INSERT INTO QUANLY (ID, NgayNhanChuc) VALUES (1, '2020-01-01');

INSERT INTO BEPTRUONG (ID, ChuyenMon, NgayNhanChuc) VALUES (2, N'Bếp Âu Á', '2020-02-01');

INSERT INTO QUANLYKHO (ID, NhomNguyenLieu) VALUES (7, N'Tổng hợp');

INSERT INTO LETAN (ID, NgoaiNgu) VALUES (5, N'Tiếng Anh'), (6, N'Tiếng Trung, Tiếng Anh');

INSERT INTO PHUCVU (ID, CaLamViec) VALUES 
(8, N'Sáng'), (9, N'Chiều'), (10, N'Tối'), (11, N'Cả ngày'), (12, N'Sáng'), (15, N'Tối');

-- 4. KHACHHANG
INSERT INTO KHACHHANG (SDT, HoTen, Flag_ThanhVien, Email, NgaySinh, GioiTinh, HangThanhVien, DiemTichLuy) VALUES
('0987654321', N'Khách Vãng Lai A', 0, NULL, NULL, NULL, NULL, NULL),
('0987654322', N'Nguyễn Thị VIP', 1, 'vip1@email.com', '1990-01-01', N'Nữ', N'VIP', 2000),
('0987654323', N'Trần Văn Thân Thiết', 1, 'thanthiet@email.com', '1995-05-05', N'Nam', N'Thành viên', 500),
('0987654324', N'Lê Thị Mới', 1, 'moi@email.com', '2000-10-10', N'Nữ', N'Thành viên', 50),
('0987654325', N'Phạm Văn C', 0, NULL, NULL, NULL, NULL, NULL),
('0987654326', N'Hoàng Văn D', 0, NULL, NULL, NULL, NULL, NULL),
('0987654327', N'Vũ Thị E', 1, 'vu.e@email.com', '1998-12-12', N'Nữ', N'VIP', 1500),
('0987654328', N'Ngô Văn F', 0, NULL, NULL, NULL, NULL, NULL),
('0987654329', N'Đặng Thị G', 1, 'dang.g@email.com', '1992-03-03', N'Nữ', N'Thành viên', 200),
('0987654330', N'Bùi Văn H', 0, NULL, NULL, NULL, NULL, NULL),
('0987654331', N'Đỗ Thị I', 1, 'do.i@email.com', '1993-04-04', N'Nữ', N'VIP', 3000),
('0987654332', N'Hồ Văn K', 0, NULL, NULL, NULL, NULL, NULL),
('0987654333', N'Dương Thị L', 1, 'duong.l@email.com', '1999-09-09', N'Nữ', N'Thành viên', 100),
('0987654334', N'Mai Văn M', 0, NULL, NULL, NULL, NULL, NULL),
('0987654335', N'Cao Thị N', 1, 'cao.n@email.com', '2001-01-01', N'Nữ', N'Thành viên', 0);

-- 5. BAN
INSERT INTO BAN (SucChua, TrangThai) VALUES
(2, N'Trống'), (2, N'Đang phục vụ'), (4, N'Đã đặt'), (4, N'Trống'), (4, N'Đang phục vụ'),
(6, N'Trống'), (6, N'Đã đặt'), (8, N'Trống'), (8, N'Đang phục vụ'), (10, N'Trống'),
(2, N'Trống'), (4, N'Trống'), (6, N'Đang phục vụ'), (10, N'Đã đặt'), (20, N'Trống');

-- 6. MONAN
INSERT INTO MONAN (Ten, PhanLoai, MoTa, DonGia, DangPhucVu) VALUES
(N'Phở Bò Đặc Biệt', N'Mặn', N'Nạm, Gầu, Gân, Bò Viên', 75000, 1),
(N'Cơm Tấm Sườn Bì', N'Mặn', N'Sườn nướng than hoa', 60000, 1),
(N'Bún Bò Huế', N'Mặn', N'Chuẩn vị Huế', 70000, 1),
(N'Gỏi Cuốn Tôm Thịt', N'Mặn', N'Tôm tươi, thịt ba chỉ', 15000, 1),
(N'Chả Giò Hải Sản', N'Mặn', N'Giòn rụm', 50000, 1),
(N'Lẩu Thái Hải Sản', N'Mặn', N'Cay nồng', 250000, 1),
(N'Mì Xào Giòn', N'Mặn', N'Hải sản thập cẩm', 85000, 1),
(N'Đậu Hũ Sốt Cà', N'Chay', N'Đậu hũ non', 40000, 1),
(N'Rau Muống Xào Tỏi', N'Chay', N'Xanh mướt', 35000, 1),
(N'Canh Chua Cá Lóc', N'Mặn', N'Miền Tây', 90000, 1),
(N'Thịt Kho Tàu', N'Mặn', N'Trứng vịt, nước dừa', 80000, 1),
(N'Gà Chiên Nước Mắm', N'Mặn', N'Đậm đà', 95000, 1),
(N'Bò Lúc Lắc', N'Mặn', N'Khoai tây chiên', 120000, 1),
(N'Cơm Chiên Dương Châu', N'Mặn', N'Đầy đủ topping', 75000, 1),
(N'Trà Đá', N'Chay', N'Mát lạnh', 5000, 1);

-- 7. NGUYENLIEU
INSERT INTO NGUYENLIEU (Ten, DonViTinh, DonGia) VALUES
(N'Thịt Bò', N'Kg', 250000),      -- ID 1
(N'Thịt Heo', N'Kg', 120000),    -- ID 2
(N'Tôm Sú', N'Kg', 300000),       -- ID 3
(N'Gạo Tám Thơm', N'Kg', 20000), -- ID 4
(N'Rau Muống', N'Kg', 15000),     -- ID 5
(N'Cà Chua', N'Kg', 25000),       -- ID 6
(N'Đậu Hũ', N'Miếng', 3000),     -- ID 7
(N'Trứng Gà', N'Quả', 3500),     -- ID 8
(N'Nước Mắm', N'Lít', 40000),     -- ID 9
(N'Dầu Ăn', N'Lít', 35000),      -- ID 10
(N'Bún Tươi', N'Kg', 12000),      -- ID 11
(N'Bánh Phở', N'Kg', 15000),      -- ID 12
(N'Hành Tây', N'Kg', 20000),      -- ID 13
(N'Tỏi', N'Kg', 50000),           -- ID 14
(N'Đường', N'Kg', 18000),         -- ID 15
(N'Chén sứ trắng', N'Cái', 15000),-- ID 16
(N'Đĩa sứ lớn', N'Cái', 25000),   -- ID 17
(N'Muỗng inox', N'Cái', 5000);    -- ID 18

-- 8. NHACUNGCAP
INSERT INTO NHACUNGCAP (Ten, Email, DiaChi) VALUES
(N'Công ty Thực Phẩm Sạch A', 'contact@foodA.com', N'Q1, HCM'),
(N'Nông Trại B', 'farmB@email.com', N'Đồng Nai'),
(N'Hải Sản C', 'seafoodC@email.com', N'Vũng Tàu'),
(N'Gạo Ngon D', 'riceD@email.com', N'Long An'),
(N'Gia Vị E', 'spiceE@email.com', N'Q5, HCM'),
(N'Rau Củ F', 'vegF@email.com', N'Đà Lạt'),
(N'Thịt G', 'meatG@email.com', N'Bình Dương'),
(N'Nước Giải Khát H', 'drinkH@email.com', N'Q3, HCM'),
(N'Trứng I', 'eggI@email.com', N'Tiền Giang'),
(N'Bao Bì K', 'packK@email.com', N'Tân Bình, HCM'),
(N'Thiết Bị Bếp L', 'kitchenL@email.com', N'Q10, HCM'),
(N'Gas M', 'gasM@email.com', N'Q7, HCM'),
(N'Vệ Sinh N', 'cleanN@email.com', N'Q4, HCM'),
(N'Rượu Vang O', 'wineO@email.com', N'Q1, HCM'),
(N'Bia P', 'beerP@email.com', N'Thủ Đức, HCM');

-- 9. SDT_NHACUNGCAP
INSERT INTO SDT_NHACUNGCAP (ID_Nha_Cung_Cap, SDT) VALUES
(1, '02811112222'), (2, '02833334444'), (3, '02855556666'), (4, '02877778888'), (5, '02899990000'),
(6, '02812121212'), (7, '02834343434'), (8, '02856565656'), (9, '02878787878'), (10, '02890909090'),
(11, '02811223344'), (12, '02855667788'), (13, '02899887766'), (14, '02811111111'), (15, '02822222222');

-- 10. CUNGCAP (Nhập hàng)
INSERT INTO CUNGCAP (ID_NhaCungCap, ID_NguyenLieu, ID_Kho, ThoiGian, SoLuong, DonViTinh, DonGia) VALUES
(1, 1, 3, '2023-10-01', 100, N'Kg', 240000),   -- Nhà cung cấp 1 nhập Thịt Bò vào Kho Đông[cite: 2]
(2, 5, 2, '2023-10-02', 50, N'Kg', 14000),     -- Nhà cung cấp 2 nhập Rau Muống vào Kho Mát[cite: 2]
(3, 3, 3, '2023-10-03', 20, N'Kg', 290000),    -- Nhà cung cấp 3 nhập Tôm Sú vào Kho Đông[cite: 2]
(4, 4, 1, '2023-10-04', 200, N'Kg', 19000),    -- Nhà cung cấp 4 nhập Gạo vào Kho Khô[cite: 2]
(5, 15, 1, '2023-10-05', 100, N'Kg', 17000),   -- Nhà cung cấp 5 nhập Đường vào Kho Khô[cite: 2]
(7, 2, 3, '2023-10-06', 150, N'Kg', 115000),   -- Nhà cung cấp 7 nhập Thịt Heo vào Kho Đông[cite: 2]
(9, 8, 1, '2023-10-07', 1000, N'Quả', 3200),   -- Nhà cung cấp 9 nhập Trứng vào Kho Khô[cite: 2]
(1, 1, 3, '2023-10-08', 50, N'Kg', 250000),    -- Nhập thêm Thịt Bò[cite: 2]
(6, 6, 2, '2023-10-09', 30, N'Kg', 24000),     -- Nhà cung cấp 6 nhập Cà Chua vào Kho Mát[cite: 2]
(5, 9, 1, '2023-10-10', 100, N'Lít', 38000),   -- Nhà cung cấp 5 nhập Nước Mắm vào Kho Khô[cite: 2]
(1, 12, 2, '2023-10-11', 50, N'Kg', 14000),    -- Nhà cung cấp 1 nhập Bánh Phở vào Kho Mát[cite: 2]
(2, 13, 1, '2023-10-12', 40, N'Kg', 19000),    -- Nhà cung cấp 2 nhập Hành Tây vào Kho Khô[cite: 2]
(3, 3, 3, '2023-10-13', 20, N'Kg', 300000),    -- Nhập thêm Tôm Sú[cite: 2]
(4, 4, 1, '2023-10-14', 100, N'Kg', 20000),    -- Nhập thêm Gạo[cite: 2]
(7, 2, 3, '2023-10-15', 80, N'Kg', 120000);    -- Nhập thêm Thịt Heo[cite: 2]

-- 11. KIEMKE (Lưu ý: SoLuongHeThong lấy ngẫu nhiên giả lập)
INSERT INTO KIEMKE (ID_QuanLyKho, ID_Kho, ID_NguyenLieu, ThoiGian, SoLuongHeThong, SoLuongThucTe, TinhTrang, DaXuLy) VALUES
-- Nhóm Kho Đông (ID_Kho = 3)
(7, 3, 1, '2023-10-30', 50.5, 50.0, N'Hao hụt tự nhiên', 1),  -- Thịt Bò
(7, 3, 2, '2023-10-30', 100.0, 98.0, N'Hư hỏng nhẹ', 1),     -- Thịt Heo
(7, 3, 3, '2023-10-30', 30.0, 30.0, N'Đủ', 1),              -- Tôm Sú

-- Nhóm Kho Khô (ID_Kho = 1)
(7, 1, 4, '2023-10-30', 500.0, 495.0, N'Chuột cắn bao bì', 0), -- Gạo Tám Thơm
(7, 1, 8, '2023-10-30', 500.0, 490.0, N'Vỡ khi vận chuyển', 1),-- Trứng Gà
(7, 1, 9, '2023-10-30', 50.0, 50.0, N'Đủ', 1),               -- Nước Mắm
(7, 1, 10, '2023-10-30', 100.0, 99.0, N'Đổ', 1),              -- Dầu Ăn
(7, 1, 13, '2023-10-30', 25.0, 25.0, N'Đủ', 1),               -- Hành Tây
(7, 1, 14, '2023-10-30', 10.0, 9.5, N'Hao hụt', 1),           -- Tỏi
(7, 1, 15, '2023-10-30', 50.0, 50.0, N'Đủ', 1),               -- Đường

-- Nhóm Kho Mát (ID_Kho = 2)
(7, 2, 5, '2023-10-30', 20.0, 15.0, N'Héo, bỏ', 1),           -- Rau Muống
(7, 2, 6, '2023-10-30', 15.0, 15.0, N'Đủ', 1),               -- Cà Chua
(7, 2, 7, '2023-10-30', 200.0, 200.0, N'Đủ', 1),              -- Đậu Hũ
(7, 2, 11, '2023-10-30', 40.0, 40.0, N'Đủ', 1),              -- Bún Tươi
(7, 2, 12, '2023-10-30', 40.0, 38.0, N'Hết hạn', 0),          -- Bánh Phở

-- Nhóm Kho Công Cụ (ID_Kho = 4)
(7, 4, 16, '2023-10-30', 200.0, 195.0, N'Bể vỡ trong quá trình rửa', 1), -- Chén sứ trắng
(7, 4, 17, '2023-10-30', 150.0, 150.0, N'Đủ', 1),                      -- Đĩa sứ lớn
(7, 4, 18, '2023-10-30', 300.0, 298.0, N'Thất thoát chưa rõ lý do', 0); -- Muỗng inox

-- 12. DATBAN
INSERT INTO DATBAN (SoLuongKhach, ThoiGianDat, TrangThai, GhiChu, ID_LeTan, SDT_Khach, ID_Ban) VALUES
(4, '2026-12-01 18:00', N'Đã nhận bàn', N'Sinh nhật', 5, '0987654322', 3),
(2, '2026-12-20 19:00', N'Đã hủy', N'Khách bận', 6, '0987654323', NULL),
(10, '2026-12-20 12:00', N'Đã đặt', N'Công ty', 5, '0987654327', 14),
(6, '2026-12-20 18:30', N'Đã nhận bàn', NULL, 6, '0987654331', 7),
(2, '2026-12-20 19:00', N'Đã đặt', NULL, 5, '0987654333', 1),
(4, '2026-12-20 20:00', N'Đã đặt', N'Gần cửa sổ', 6, '0987654324', 4),
(8, '2026-12-20 11:00', N'Đã nhận bàn', NULL, 5, '0987654329', 8),
(2, '2026-12-17 12:00', N'Đã đặt', NULL, 6, '0987654335', 2),
(6, '2026-12-17 18:00', N'Đã hủy', N'Mưa', 5, '0987654322', NULL),
(10, '2026-12-19 19:00', N'Đã nhận bàn', N'Tiệc', 6, '0987654327', 10),
(4, '2026-12-18 12:00', N'Đã đặt', NULL, 5, '0987654331', 12),
(2, '2026-12-18 13:00', N'Đã đặt', NULL, 6, '0987654323', 11),
(8, '2026-12-18 18:00', N'Đã nhận bàn', NULL, 5, '0987654329', 9),
(6, '2026-12-19 19:00', N'Đã đặt', NULL, 6, '0987654333', 6),
(4, '2026-12-20 12:00', N'Đã nhận bàn', NULL, 5, '0987654324', 5);

-- 13. DONGOIMON (Mỗi đơn tương ứng với một bàn đang phục vụ hoặc đã xong)
INSERT INTO DONGOIMON (ThoiGianTao, TrangThai, ID_Ban, ID_PhucVu) VALUES
('2023-11-01 18:10', N'Đã thanh toán', 3, 8),
('2023-11-02 12:10', N'Đã thanh toán', 14, 9),
('2023-11-02 18:40', N'Đã thanh toán', 7, 10),
('2023-11-04 11:10', N'Đã thanh toán', 8, 11),
('2023-11-05 19:10', N'Đã thanh toán', 10, 12),
('2023-11-07 18:10', N'Đang phục vụ', 9, 8),
('2023-11-08 12:10', N'Đang phục vụ', 5, 9),
('2023-11-08 12:30', N'Đang phục vụ', 2, 10), -- Khách vãng lai
('2023-11-08 13:00', N'Đang phục vụ', 13, 11), -- Khách vãng lai
('2023-11-08 13:15', N'Đang phục vụ', 4, 12),
('2023-11-08 18:00', N'Đã thanh toán', 1, 8),
('2023-11-08 18:30', N'Đã thanh toán', 6, 9),
('2023-11-08 19:00', N'Đang phục vụ', 11, 10),
('2023-11-08 19:30', N'Đang phục vụ', 12, 11),
('2023-11-08 20:00', N'Đang phục vụ', 15, 12);

-- 14. LANGOIMON (Mỗi đơn có thể gọi nhiều lần)
INSERT INTO LANGOIMON (ID_Don, ThoiDiemGoi, TrangThai, GhiChu, ID_PhucVu, ID_BepTruong) VALUES
(1, '2023-11-01 18:15', N'Đã phục vụ', N'Lên nhanh', 8, 2),
(1, '2023-11-01 18:45', N'Đã phục vụ', N'Thêm nước', 8, 2),
(2, '2023-11-02 12:15', N'Đã phục vụ', NULL, 9, 2),
(3, '2023-11-02 18:45', N'Đã phục vụ', NULL, 10, 2),
(4, '2023-11-04 11:15', N'Đã phục vụ', NULL, 11, 2),
(5, '2023-11-05 19:15', N'Đã phục vụ', NULL, 12, 2),
(6, '2023-11-07 18:15', N'Sẵn sàng phục vụ', NULL, 8, 2),
(6, '2023-11-07 18:45', N'Đang xử lý', NULL, 8, NULL),
(7, '2023-11-08 12:15', N'Đang xử lý', NULL, 9, NULL),
(8, '2023-11-08 12:35', N'Đang xử lý', NULL, 10, NULL),
(9, '2023-11-08 13:05', N'Đang xử lý', NULL, 11, NULL),
(10, '2023-11-08 13:20', N'Đang xử lý', NULL, 12, NULL),
(11, '2023-11-08 18:05', N'Đã phục vụ', NULL, 8, 2),
(12, '2023-11-08 18:35', N'Đã phục vụ', NULL, 9, 2),
(13, '2023-11-08 19:05', N'Đang xử lý', NULL, 10, NULL);

-- 15. LANGOIMON_MON (Chi tiết món ăn)
INSERT INTO LANGOIMON_MON (ID_LanGoi, ID_MonAn, SoLuong, DonGiaThoiDiem) VALUES
(1, 1, 2, 75000), (1, 2, 2, 60000), -- Đơn 1 lần 1
(2, 15, 4, 5000), -- Đơn 1 lần 2
(3, 6, 2, 250000), (3, 13, 2, 120000), -- Đơn 2
(4, 3, 4, 70000), (4, 4, 4, 15000), -- Đơn 3
(5, 7, 5, 85000), -- Đơn 4
(6, 1, 10, 75000), (6, 15, 10, 5000), -- Đơn 5
(7, 10, 1, 90000), (7, 11, 1, 80000), -- Đơn 6 lần 1
(8, 15, 2, 5000), -- Đơn 6 lần 2
(9, 14, 2, 75000), -- Đơn 7
(10, 5, 4, 50000), -- Đơn 8
(11, 8, 2, 40000), -- Đơn 9
(12, 9, 1, 35000), -- Đơn 10
(13, 12, 2, 95000), -- Đơn 11
(14, 2, 3, 60000), -- Đơn 12
(15, 6, 1, 250000); -- Đơn 13

-- 16. THANHTOAN
-- Lưu ý: TongTienMon được tính nhẩm từ LANGOIMON_MON. GiamGia random.
INSERT INTO THANHTOAN (ID_Don, ID_LeTan, SDT_Khach, ThoiGianThanhToan, PhuongThuc, TongTienMon, GiamGia) VALUES
(1, 5, '0987654322', '2023-11-01 19:00', N'Tiền mặt', 290000, 20000),
(2, 6, '0987654327', '2023-11-02 13:30', N'Thẻ', 740000, 0),
(3, 5, '0987654331', '2023-11-02 20:00', N'Chuyển khoản', 340000, 30000),
(4, 6, '0987654329', '2023-11-04 12:30', N'Tiền mặt', 425000, 0),
(5, 5, '0987654327', '2023-11-05 21:00', N'Thẻ', 800000, 50000),
(11, 6, '0987654333', '2023-11-08 19:00', N'Tiền mặt', 190000, 10000),
(12, 5, '0987654323', '2023-11-08 19:30', N'Chuyển khoản', 180000, 0);

-- 17. YEU_CAU_CAP_NHAT_MON
INSERT INTO CAPNHAT_MONAN 
(ID_BepTruong, ID_QuanLy, ID_MonAn, ThoiGianTao, ThoiGianDuyet, LoaiYeuCau, TrangThai, TenMon_DeXuat, DonGia_DeXuat, MoTa_DeXuat, PhanLoai_DeXuat, LyDo) 
VALUES
(2, 1, 1, '2023-10-01 08:00:00', '2023-10-01 10:00:00', N'Sửa', N'Đã duyệt', NULL, 80000, NULL, NULL, N'Tăng giá do thịt bò tăng'),
(2, 1, 2, '2023-10-02 09:30:00', '2023-10-02 11:00:00', N'Sửa', N'Đã duyệt', NULL, 65000, NULL, NULL, N'Điều chỉnh định lượng'),
(2, NULL, 3, '2023-11-08 14:00:00', NULL, N'Sửa', N'Chờ duyệt', NULL, 75000, NULL, NULL, N'Đề xuất tăng giá cuối năm'),
(2, 1, NULL, '2023-10-05 15:00:00', '2023-10-06 09:00:00', N'Thêm', N'Đã duyệt', N'Lẩu Cá Kèo', 200000, N'Đặc sản miền Tây', N'Mặn', N'Bổ sung thực đơn lẩu'),
(2, NULL, NULL, '2023-11-08 08:00:00', NULL, N'Thêm', N'Chờ duyệt', N'Bò Né', 90000, N'Kèm bánh mì, trứng ốp la', N'Mặn', N'Món ăn sáng mới'),
(2, 1, 10, '2023-10-10 10:00:00', '2023-10-10 10:30:00', N'Xóa', N'Từ chối', NULL, NULL, NULL, NULL, N'Món này đang bán chạy, không được xóa'),
(2, NULL, 11, '2023-11-07 16:00:00', NULL, N'Xóa', N'Chờ duyệt', NULL, NULL, NULL, NULL, N'Nguyên liệu tăng giá quá cao, khó bán'),
(2, 1, 4, '2023-10-15 11:00:00', '2023-10-15 14:00:00', N'Sửa', N'Đã duyệt', N'Gỏi Cuốn Tôm (Size Lớn)', 20000, N'Tôm thẻ to, thịt ba rọi rút sườn', NULL, N'Nâng cấp chất lượng món');


-- 18. BAOCAODOANHTHU
INSERT INTO BAOCAODOANHTHU (ThoiGianLap, LoaiBaoCao, Ky, Nam, TongDoanhThu, TongChiPhi) VALUES
('2023-10-31', N'Tháng', 10, 2023, 150000000, 80000000),
('2023-11-08', N'Tháng', 11, 2023, 50000000, 20000000), -- Số liệu giả định
('2023-03-31', N'Quý', 1, 2023, 400000000, 200000000),
('2023-06-30', N'Quý', 2, 2023, 450000000, 220000000),
('2023-09-30', N'Quý', 3, 2023, 420000000, 210000000),
('2022-12-31', N'Năm', 2022, 2022, 1500000000, 700000000),
('2023-01-31', N'Tháng', 1, 2023, 120000000, 60000000),
('2023-02-28', N'Tháng', 2, 2023, 130000000, 65000000),
('2023-04-30', N'Tháng', 4, 2023, 140000000, 70000000);

-- 19. KHO
-- Thêm các kho lưu trữ
INSERT INTO KHO (Ten, LoaiKho, TrangThai, ViTri) VALUES
(N'Kho Khô Trung Tâm', N'Kho khô', N'Bình thường', N'Tầng hầm 1'), -- ID 1
(N'Kho Lạnh Thực Phẩm', N'Kho mát', N'Bình thường', N'Khu vực bếp'), -- ID 2
(N'Kho Đông Hải Sản', N'Kho đông', N'Cần bảo trì', N'Khu vực sau nhà'), -- ID 3
(N'Kho Công Cụ & Chén Bát', N'Kho công cụ', N'Bình thường', N'Tầng 1'); -- ID 4

-- 20. CHUA
-- Phân bổ nguyên liệu vào các kho (Mapping ID_Kho và ID_NguyenLieu)
INSERT INTO CHUA (ID_Kho, ID_NguyenLieu, SoLuong) VALUES
-- Kho Khô (ID 1)
(1, 4, 500.0),  -- Gạo
(1, 15, 50.0),  -- Đường
(1, 10, 100.0), -- Dầu ăn
-- Kho Mát (ID 2)
(2, 5, 20.0),   -- Rau Muống
(2, 6, 15.0),   -- Cà Chua
(2, 7, 200.0),  -- Đậu Hũ
-- Kho Đông (ID 3)
(3, 1, 50.5),   -- Thịt Bò
(3, 2, 100.0),  -- Thịt Heo
(3, 3, 30.0),   -- Tôm Sú
-- Kho Công Cụ (ID 4)
(4, 16, 200.0), -- Chén sứ
(4, 17, 150.0), -- Đĩa sứ
(4, 18, 300.0); -- Muỗng inox

--INSERT DATA CHO table NGUYENLIEU_MONAN
INSERT INTO NGUYENLIEU_MONAN (ID_MonAn, ID_NguyenLieu, SoLuongNgLieuDung, DonViTinh) VALUES
-- 1. Phở Bò Đặc Biệt (ID 1)
(1, 1, 0.25, N'Kg'),   -- Thịt bò
(1, 12, 0.20, N'Kg'),  -- Bánh phở
(1, 13, 0.05, N'Kg'),  -- Hành tây
-- 2. Cơm Tấm Sườn Bì (ID 2)
(2, 2, 0.15, N'Kg'),   -- Thịt heo (Sườn)
(2, 4, 0.20, N'Kg'),   -- Gạo
(2, 9, 0.02, N'Lít'),  -- Nước mắm
-- 3. Bún Bò Huế (ID 3)
(3, 1, 0.10, N'Kg'),   -- Thịt bò
(3, 11, 0.20, N'Kg'),  -- Bún tươi
-- 4. Gỏi Cuốn Tôm Thịt (ID 4)
(4, 3, 0.10, N'Kg'),   -- Tôm
(4, 2, 0.05, N'Kg'),   -- Thịt heo
-- 8. Đậu Hũ Sốt Cà (ID 8)
(8, 7, 2.0, N'Miếng'), -- Đậu hũ
(8, 6, 0.10, N'Kg'),   -- Cà chua
-- 15. Trà Đá (ID 15)
(15, 15, 0.01, N'Kg'); -- Đường (pha trà)
