------------ Kiểm tra nghiệp vụ Nhập kho (CUNGCAP -> CHUA)
--Nghiệp vụ này kiểm tra xem khi nhập hàng, số lượng trong kho tương ứng có tự động tăng lên hay không.

-- 1. Kiểm tra tồn kho hiện tại của 'Thịt Bò' (ID=1) tại 'Kho Đông Hải Sản' (ID=3)
SELECT * FROM CHUA WHERE ID_Kho = 3 AND ID_NguyenLieu = 1;

-- 2. Thực hiện nhập thêm 50kg Thịt Bò vào Kho 3
INSERT INTO CUNGCAP (ID_NhaCungCap, ID_NguyenLieu, ID_Kho, SoLuong, DonViTinh, DonGia) 
VALUES (1, 1, 3, 50, N'Kg', 250000);

-- 3. Kiểm tra lại bảng CHUA
SELECT * FROM CHUA WHERE ID_Kho = 3 AND ID_NguyenLieu = 1;
--Kết quả đúng: Cột SoLuong trong bảng CHUA phải tăng thêm 50 đơn vị so với ban đầu nhờ vào trg_CapNhatCHUA_KhiNhapHang. (ĐÚNG)

-------------- Kiểm tra nghiệp vụ Kiểm kê và Cân bằng kho (KIEMKE)
--Đây là nghiệp vụ quan trọng nhất. Chúng ta sẽ giả lập tình huống: Hệ thống ghi nhận 100kg nhưng thực tế chỉ còn 95kg.

--1. Khởi tạo phiếu kiểm kê:
-- Giả sử Quản lý kho (ID=7) kiểm tra Kho đông (ID=3) cho Thịt heo (ID=2)
EXEC sp_KhoiTaoKiemKe @ID_QuanLyKho = 7, @ID_Kho = 3, @ID_NguyenLieu = 2;

--2. Xác nhận số lượng thực tế và Xử lý chênh lệch:
-- Xem phiếu vừa tạo, lúc này DaXuLy = 0
SELECT * FROM KIEMKE WHERE ID_Kho = 3 AND ID_NguyenLieu = 2;

-- Cập nhật số thực tế là 95 (giả sử hệ thống đang là 100) và chốt phiếu (DaXuLy = 1)
UPDATE KIEMKE 
SET SoLuongThucTe = 95, DaXuLy = 1 
WHERE ID_Kho = 3 AND ID_NguyenLieu = 2 AND DaXuLy = 0;

--3. Kiểm tra kết quả cân bằng:
-- Kiểm tra bảng CHUA
SELECT * FROM CHUA WHERE ID_Kho = 3 AND ID_NguyenLieu = 2;

--Kết quả đúng: Cột SoLuong trong bảng CHUA phải tự động cập nhật về con số 95 nhờ vào trg_CanBangKho_SauKiemKe. (ĐÚNG)

-------------- Kiểm tra logic "Hết nguyên liệu - Dừng phục vụ món"
--Nghiệp vụ này kiểm tra tính liên kết giữa Kho và Thực đơn.

-- 1. Xem trạng thái món 'Phở Bò' (ID=1)
SELECT ID, Ten, DangPhucVu FROM MONAN WHERE ID = 1;

-- 2. Giả lập hết sạch Thịt Bò (ID=1) trong tất cả các kho
UPDATE CHUA SET SoLuong = 0 WHERE ID_NguyenLieu = 1;

-- 3. Kiểm tra lại trạng thái món ăn
SELECT ID, Ten, DangPhucVu FROM MONAN WHERE ID = 1;

--Kết quả đúng: Cột DangPhucVu của món Phở Bò phải tự động chuyển về 0 (False) vì tổng tồn kho thịt bò đã bằng 0, không đủ định lượng nấu món. (ĐÚNG)

-------------- Kiểm tra báo cáo chi phí nhập hàng (BAOCAODOANHTHU)
--Kiểm tra xem dữ liệu từ các lần nhập kho có được tổng hợp vào báo cáo tài chính hay không.
-- Chạy thủ tục tạo báo cáo cho tháng hiện tại
EXEC sp_TaoVaLuuBaoCao @LoaiBaoCao = N'Tháng', @Ky = 11, @Nam = 2023;
-- Kiểm tra bảng báo cáo
SELECT * FROM BAOCAODOANHTHU;
--Kết quả đúng: Cột TongChiPhi phải bao gồm tổng số tiền (SoLuong * DonGia) từ các bản ghi trong bảng CUNGCAP thuộc tháng đó.

