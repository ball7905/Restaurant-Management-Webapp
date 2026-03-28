/************************************************************
 SQL Server schema & sample data for Restaurant Management
************************************************************/

USE DB_RESTAURANT

CREATE TABLE NHANVIEN (
    ID              INT IDENTITY(1,1)       PRIMARY KEY, -- Xử lý format khác trên BE
    CCCD            VARCHAR(12)             NOT NULL UNIQUE,   
    HoTen           NVARCHAR(200)           NOT NULL,
    NgaySinh        DATE                    NOT NULL,
    NgayVaoLam      DATE                    NOT NULL DEFAULT GETDATE(),
    NgayNghiViec    DATE,
    Luong           DECIMAL(12,2)           NOT NULL CHECK (Luong > 0),
    DiaChi          NVARCHAR(300),
    ChucDanh        NVARCHAR(50)            NOT NULL CHECK (ChucDanh IN (N'Quản lý',N'Bếp trưởng',N'Đầu bếp',N'Phục vụ',N'Lễ tân',N'Quản lý kho')),
    LoaiHinhLamViec NVARCHAR(50)            NULL,
    ID_GiamSat      INT                     NULL,

    CONSTRAINT CK_NHANVIEN_CCCD CHECK (LEN(CCCD) = 12 AND CCCD NOT LIKE '%[^0-9]%'),
    CONSTRAINT CK_NHANVIEN_AGE CHECK (DATEDIFF(DAY, NgaySinh, GETDATE())/365.25 >= 18), -- Xét theo ngày
    CONSTRAINT CK_NHANVIEN_NGAYVAOLAM CHECK (NgayVaoLam <= CONVERT(date, GETDATE()))
);

CREATE TABLE SDT_NHANVIEN (
    ID_NhanVien     INT                 NOT NULL, -- Chỉ có tham chiếu ID nhân viên
    SDT             VARCHAR(20)         UNIQUE NOT NULL,

    PRIMARY KEY (ID_NhanVien, SDT),
    CONSTRAINT CK_SDT_NHANVIEN CHECK (LEN(SDT) >= 10 AND SDT NOT LIKE '%[^0-9]%')
);

/* Để phân biệt khách vãng lai và thành viên sử dụng Flag_ThanhVien:
    Về sau cần Trigger để viết ràng buộc các thuộc tính có thể NULL 
    (Email, NgaySinh, GioiTinh, HangThanhVien, DiemTichLuy)
*/
CREATE TABLE KHACHHANG (
    SDT             VARCHAR(20)         PRIMARY KEY,
    HoTen           NVARCHAR(50)        NOT NULL,
    Flag_ThanhVien  BIT                 NOT NULL DEFAULT 0, -- Cần trigger
    Email           NVARCHAR(100),
    NgaySinh        DATE                NULL,
    GioiTinh        NVARCHAR(10)        NULL CHECK (GioiTinh IN (N'Nam',N'Nữ',N'Khác')),
    HangThanhVien   NVARCHAR(20)        NULL CHECK (HangThanhVien IN (N'Thành viên',N'VIP')),
    DiemTichLuy     INT                 NULL CHECK (DiemTichLuy >= 0),
-- (Sẽ dùng TRIGGER/PROCEDURE để set giá trị 0 khi Flag = 1)

    CONSTRAINT CK_SDT_KHACHHANG CHECK (LEN(SDT) >= 10 AND SDT NOT LIKE '%[^0-9]%')
);

CREATE TABLE BAN (
    ID_Ban          INT IDENTITY(1,1)   PRIMARY KEY,
    TrangThai       NVARCHAR(20)        NOT NULL DEFAULT N'Trống' CHECK (TrangThai IN (N'Trống',N'Đã đặt',N'Đang phục vụ')),
    SucChua         INT                 NOT NULL CHECK (SucChua > 0)
);

CREATE TABLE MONAN (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    -- Optional: thêm cơ chế quản lý về Mã món ăn kiểu FO01, DR03,...
    Ten             NVARCHAR(100)       NOT NULL UNIQUE,
    PhanLoai        NVARCHAR(10)        NOT NULL CHECK (PhanLoai IN (N'Chay',N'Mặn')),
    MoTa            NVARCHAR(500),
    DonGia          DECIMAL(12,0)       NOT NULL CHECK (DonGia > 0),
    DangPhucVu      BIT                 NOT NULL DEFAULT 1, -- 1: Còn, 0: Hết (Tạm thời)
    DangKinhDoanh   BIT                 NOT NULL DEFAULT 1  -- 1: Đang bán, 0: Ngừng kinh doanh
);

CREATE TABLE NGUYENLIEU (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    Ten             NVARCHAR(500)       NOT NULL UNIQUE,
    DonViTinh       NVARCHAR(50)        NOT NULL, -- kg, cái, lít,...
    SoLuong         DECIMAL(12,2)       NOT NULL CHECK (SoLuong >= 0),
    DonGia          DECIMAL(12,2)       NOT NULL CHECK (DonGia >= 0)
);

CREATE TABLE NHACUNGCAP (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    Ten             NVARCHAR(200)       NOT NULL,
    Email           NVARCHAR(100),
    DiaChi          NVARCHAR(300)
);

CREATE TABLE SDT_NHACUNGCAP (
    ID_Nha_Cung_Cap INT                 NOT NULL,
    SDT             VARCHAR(20)         NOT NULL,

    PRIMARY KEY (ID_Nha_Cung_Cap, SDT),
    CONSTRAINT CK_SDT_NHACUNGCAP CHECK (LEN(SDT) >= 10 AND SDT NOT LIKE '%[^0-9]%')
);

-- Relationship: NHACUNGCAP - NGUYENLIEU
CREATE TABLE CUNGCAP (
    ID              INT IDENTITY(1,1)       PRIMARY KEY,
    ID_NhaCungCap   INT                     NOT NULL,
    ID_NguyenLieu   INT                     NOT NULL,
    ThoiGian        DATETIME2               NOT NULL DEFAULT SYSUTCDATETIME(),
    SoLuong         DECIMAL(12,2)           NOT NULL CHECK (SoLuong >= 0),
    DonViTinh       NVARCHAR(20)            NOT NULL,
    DonGia          DECIMAL(12,2)           NOT NULL CHECK (DonGia >= 0),
    TongTien        AS (SoLuong * DonGia)   PERSISTED
);

-- Relationship: QUANLYKHO - NGUYENLIEU
CREATE TABLE KIEMKE (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ID_QuanLyKho    INT                 NOT NULL,
    ID_NguyenLieu   INT                 NOT NULL,
    ThoiGian        DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),

    SoLuongHeThong  DECIMAL(12,2)       NOT NULL,
    SoLuongThucTe   DECIMAL(12,2)       NOT NULL,
    ChenhLech       AS (SoLuongThucTe - SoLuongHeThong) PERSISTED, -- Lệch bao nhiêu?
    
    TinhTrang       NVARCHAR(200)       NULL, -- Ghi chú: "Hư hỏng", "Hết hạn", "Mất"...
    DaXuLy          BIT                 DEFAULT 0 -- 0: Chưa xử lý, 1: Đã cân bằng kho/Đã nhập thêm
);

-- Cần có Procedure để tự động tạo báo cáo doanh thu định kỳ
CREATE TABLE BAOCAODOANHTHU (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ThoiGianLap     DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),
    
    LoaiBaoCao      NVARCHAR(10)        NOT NULL CHECK (LoaiBaoCao IN (N'Tháng', N'Quý', N'Năm')),
    Ky              INT                 NOT NULL, -- Lưu số tháng (1-12) hoặc số quý (1-4) hoặc số năm
    Nam             INT                 NOT NULL, -- Năm của kỳ báo cáo

    -- TuNgay          DATE                NULL, 
    -- DenNgay         DATE                NULL,

    TongDoanhThu    DECIMAL(18,0)       DEFAULT 0,
    TongChiPhi      DECIMAL(18,0)       DEFAULT 0,
    LoiNhuan        AS (TongDoanhThu - TongChiPhi) PERSISTED, 
    
    CONSTRAINT UQ_KyBaoCao UNIQUE (LoaiBaoCao, Ky, Nam)
);
/* Child tables to NHANVIEN */

CREATE TABLE QUANLY (
    ID              INT                 PRIMARY KEY,
    NgayNhanChuc    DATE                NOT NULL DEFAULT GETDATE(), -- Cần check điều kiện với NgayVaoLam
    NgayKetThuc     DATE                NULL
);

CREATE TABLE BEPTRUONG (
    ID              INT                 PRIMARY KEY,
    ChuyenMon       NVARCHAR(50)        NULL,
    NgayNhanChuc    DATE                NOT NULL DEFAULT GETDATE(), -- Cần check điều kiện với NgayVaoLam
    NgayKetThuc     DATE                NULL
);

CREATE TABLE PHUCVU (
    ID              INT                 PRIMARY KEY,
    CaLamViec       NVARCHAR(20)        NOT NULL CHECK (CaLamViec IN (N'Sáng', N'Chiều', N'Tối', N'Cả ngày'))
);

-- Cần sửa các tác vụ về ngoại ngữ của lễ tân
CREATE TABLE LETAN (
    ID              INT                 PRIMARY KEY,
    NgoaiNgu        NVARCHAR(100)       NULL
);

CREATE TABLE QUANLYKHO (
    ID              INT                 PRIMARY KEY,
    NhomNguyenLieu  NVARCHAR(20)        NULL
    -- Đồ khô, Nước, Thịt, Rượu, Rau Củ,...
);

/* Operation */

CREATE TABLE DATBAN (
    ID_DatBan       INT IDENTITY(1,1)   PRIMARY KEY,
    SoLuongKhach    INT                 NOT NULL CHECK (SoLuongKhach > 0),
    ThoiGianDat     DATETIME2           NOT NULL,
    TrangThai       NVARCHAR(20)        NOT NULL CHECK (TrangThai IN (N'Đã đặt',N'Đã nhận bàn',N'Đã hủy')),
    GhiChu          NVARCHAR(500),
    
    ID_LeTan        INT                 NULL,
    SDT_Khach       VARCHAR(20)         NULL,
    ID_Ban          INT                 NULL
);

CREATE TABLE DONGOIMON (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ThoiGianTao     DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),
    TrangThai       NVARCHAR(20)        NOT NULL CHECK (TrangThai IN (N'Đang phục vụ', N'Đã thanh toán')),
    
    ID_Ban          INT                 NULL,
    ID_PhucVu       INT                 NULL
);

-- Weak Entity: LANGOIMON_MON
CREATE TABLE LANGOIMON (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ID_Don          INT                 NOT NULL,
    ThoiDiemGoi     DATETIME2           NOT NULL, -- Cần check >= thời gian tạo DONGOIMON
    TrangThai       NVARCHAR(20)        NOT NULL CHECK (TrangThai IN (N'Đang xử lý', N'Sẵn sàng phục vụ', N'Đã phục vụ')),
    GhiChu          NVARCHAR(500),
    ID_PhucVu       INT                 NULL, -- Phục vụ cần thực hiện chứ năng là tạo trạng thái đang xử lý, và update từ sẵn sàng phục vụ -> đã phục vụ
    ID_BepTruong    INT                 NULL -- Bếp trưởng ở đây thực hiện chứ năng là cập nhật trạng thái món ăn từ đang xử lý -> sẵn sàng phục vụ
);

-- Relationship: LANGOIMON - MONAN
-- Dùng để lưu các món ăn được gọi trong mỗi lần gọi món (còn có tác dụng lưu history món ăn tại thời điểm gọi)
CREATE TABLE LANGOIMON_MON (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    ID_LanGoi       INT                 NOT NULL,
    ID_MonAn        INT                 NOT NULL,
    SoLuong         INT                 NOT NULL CHECK (SoLuong > 0),
    DonGiaThoiDiem  DECIMAL(12,0)       NOT NULL CHECK (DonGiaThoiDiem >= 0),
    ThanhTien AS (SoLuong * DonGiaThoiDiem) PERSISTED -- Thành tiền không nhất thiết phải lưu vì sau cùng chỉ quan tâm đến tổng tiền trong order
);

-- Relationship: DONGOIMON - LETAN - KHACHHANG
CREATE TABLE THANHTOAN (
    ID                  INT                 IDENTITY(1,1) PRIMARY KEY,
    ID_Don              INT                 NOT NULL,
    ID_LeTan            INT                 NULL,
    SDT_Khach           VARCHAR(20)         NULL,
    
    ThoiGianThanhToan   DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),
    PhuongThuc          NVARCHAR(50)        NOT NULL CHECK (PhuongThuc IN (N'Tiền mặt', N'Chuyển khoản', N'Thẻ')),

    TongTienMon         DECIMAL(18,0)       NOT NULL CHECK (TongTienMon >= 0), -- Tổng tiền từ các món ăn (Chưa giảm)
    GiamGia             DECIMAL(12,0)       NOT NULL DEFAULT 0 CHECK (GiamGia >= 0), -- Cần check thêm <= TongTienMon
    ThanhTien           AS (TongTienMon - GiamGia) -- Tính toán động
);

CREATE TABLE CAPNHAT_MONAN (
    ID              INT IDENTITY(1,1)   PRIMARY KEY,
    
    ID_BepTruong    INT                 NOT NULL,
    ID_QuanLy       INT                 NULL,
    ID_MonAn        INT                 NULL,
    
    ThoiGianTao     DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),
    ThoiGianDuyet   DATETIME2           NULL,
    
    LoaiYeuCau      NVARCHAR(10)        NOT NULL CHECK (LoaiYeuCau IN (N'Thêm', N'Sửa', N'Xóa')),
    TrangThai       NVARCHAR(20)        NOT NULL DEFAULT N'Chờ duyệt' 
                    CHECK (TrangThai IN (N'Chờ duyệt', N'Đã duyệt', N'Từ chối')),

    TenMon_DeXuat       NVARCHAR(100)       NULL,
    DonGia_DeXuat       DECIMAL(12,0)       NULL,
    MoTa_DeXuat         NVARCHAR(500)       NULL,
    PhanLoai_DeXuat     NVARCHAR(10)        NULL,
    
    LyDo                NVARCHAR(200)       NULL
);

/*-----------------Example Data-----------------*/

-- 1. NHANVIEN
INSERT INTO NHANVIEN (CCCD, HoTen, NgaySinh, NgayVaoLam, Luong, DiaChi, ChucDanh, LoaiHinhLamViec, ID_GiamSat) VALUES
('079090000001', N'Nguyễn Văn Quản Lý', '1985-01-01', '2020-01-01', 25000000, N'Quận 1, HCM', N'Quản lý', N'Fulltime', NULL),
('079090000002', N'Trần Thị Bếp Trưởng', '1988-05-10', '2020-02-01', 20000000, N'Quận 3, HCM', N'Bếp trưởng', N'Fulltime', NULL),
('079090000003', N'Lê Văn Đầu Bếp 1', '1995-08-15', '2021-03-10', 12000000, N'Thủ Đức, HCM', N'Đầu bếp', N'Fulltime', 2),
('079090000004', N'Phạm Văn Đầu Bếp 2', '1996-12-20', '2021-04-01', 11000000, N'Gò Vấp, HCM', N'Đầu bếp', N'Fulltime', 2),
('079090000005', N'Hoàng Thị Lễ Tân 1', '2000-01-01', '2022-01-01', 8000000, N'Quận 10, HCM', N'Lễ tân', N'Fulltime', 1),
('079090000006', N'Vũ Thị Lễ Tân 2', '2001-02-14', '2022-06-01', 7500000, N'Quận 5, HCM', N'Lễ tân', N'Parttime', 1),
('079090000007', N'Đặng Văn Kho', '1990-11-11', '2020-05-05', 15000000, N'Bình Thạnh, HCM', N'Quản lý kho', N'Fulltime', 1),
('079090000008', N'Bùi Thị Phục Vụ 1', '1999-09-09', '2023-01-01', 6000000, N'Quận 4, HCM', N'Phục vụ', N'Fulltime', 1),
('079090000009', N'Đỗ Văn Phục Vụ 2', '1998-07-07', '2023-02-01', 6000000, N'Quận 7, HCM', N'Phục vụ', N'Fulltime', 1),
('079090000010', N'Lý Thị Phục Vụ 3', '2002-03-03', '2023-03-01', 5500000, N'Quận 8, HCM', N'Phục vụ', N'Parttime', 1),
('079090000011', N'Ngô Văn Phục Vụ 4', '2003-04-04', '2023-04-01', 5500000, N'Quận 12, HCM', N'Phục vụ', N'Parttime', 1),
('079090000012', N'Hồ Thị Phục Vụ 5', '2000-10-10', '2023-05-01', 6000000, N'Tân Bình, HCM', N'Phục vụ', N'Fulltime', 1),
('079090000013', N'Dương Văn Bếp Phụ 1', '1997-06-06', '2022-08-01', 9000000, N'Bình Tân, HCM', N'Đầu bếp', N'Fulltime', 2),
('079090000014', N'Mai Thị Bếp Phụ 2', '1998-11-11', '2022-09-01', 9000000, N'Tân Phú, HCM', N'Đầu bếp', N'Fulltime', 2),
('079090000015', N'Cao Văn Quản Lý 2', '1986-12-12', '2019-01-01', 26000000, N'Quận 2, HCM', N'Quản lý', N'Fulltime', NULL);

-- 2. SDT_NHANVIEN
INSERT INTO SDT_NHANVIEN (ID_NhanVien, SDT) VALUES
(1, '0901000001'), (2, '0902000002'), (3, '0903000003'), (4, '0904000004'), (5, '0905000005'),
(6, '0906000006'), (7, '0907000007'), (8, '0908000008'), (9, '0909000009'), (10, '0910000010'),
(11, '0911000011'), (12, '0912000012'), (13, '0913000013'), (14, '0914000014'), (15, '0915000015');

-- 3. INSERT VÀO CÁC BẢNG CON (Mapping theo ID ở trên)
INSERT INTO QUANLY (ID, NgayNhanChuc) VALUES (1, '2020-01-01'), (15, '2019-01-01');

INSERT INTO BEPTRUONG (ID, ChuyenMon, NgayNhanChuc) VALUES (2, N'Bếp Âu Á', '2020-02-01');

INSERT INTO QUANLYKHO (ID, NhomNguyenLieu) VALUES (7, N'Tổng hợp');

INSERT INTO LETAN (ID, NgoaiNgu) VALUES (5, N'Tiếng Anh'), (6, N'Tiếng Trung, Tiếng Anh');

INSERT INTO PHUCVU (ID, CaLamViec) VALUES 
(8, N'Sáng'), (9, N'Chiều'), (10, N'Tối'), (11, N'Cả ngày'), (12, N'Sáng');

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
INSERT INTO NGUYENLIEU (Ten, DonViTinh, SoLuong, DonGia) VALUES
(N'Thịt Bò', N'Kg', 50.5, 250000),
(N'Thịt Heo', N'Kg', 100.0, 120000),
(N'Tôm Sú', N'Kg', 30.0, 300000),
(N'Gạo Tám Thơm', N'Kg', 500.0, 20000),
(N'Rau Muống', N'Kg', 20.0, 15000),
(N'Cà Chua', N'Kg', 15.0, 25000),
(N'Đậu Hũ', N'Miếng', 200.0, 3000),
(N'Trứng Gà', N'Quả', 500.0, 3500),
(N'Nước Mắm', N'Lít', 50.0, 40000),
(N'Dầu Ăn', N'Lít', 100.0, 35000),
(N'Bún Tươi', N'Kg', 40.0, 12000),
(N'Bánh Phở', N'Kg', 40.0, 15000),
(N'Hành Tây', N'Kg', 25.0, 20000),
(N'Tỏi', N'Kg', 10.0, 50000),
(N'Đường', N'Kg', 50.0, 18000);

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
INSERT INTO CUNGCAP (ID_NhaCungCap, ID_NguyenLieu, ThoiGian, SoLuong, DonViTinh, DonGia) VALUES
(1, 1, '2023-10-01', 100, N'Kg', 240000),
(2, 5, '2023-10-02', 50, N'Kg', 14000),
(3, 3, '2023-10-03', 20, N'Kg', 290000),
(4, 4, '2023-10-04', 200, N'Kg', 19000),
(5, 15, '2023-10-05', 100, N'Kg', 17000),
(7, 2, '2023-10-06', 150, N'Kg', 115000),
(9, 8, '2023-10-07', 1000, N'Quả', 3200),
(1, 1, '2023-10-08', 50, N'Kg', 250000),
(6, 6, '2023-10-09', 30, N'Kg', 24000),
(5, 9, '2023-10-10', 100, N'Lít', 38000),
(1, 12, '2023-10-11', 50, N'Kg', 14000),
(2, 13, '2023-10-12', 40, N'Kg', 19000),
(3, 3, '2023-10-13', 20, N'Kg', 300000),
(4, 4, '2023-10-14', 100, N'Kg', 20000),
(7, 2, '2023-10-15', 80, N'Kg', 120000);

-- 11. KIEMKE (Lưu ý: SoLuongHeThong lấy ngẫu nhiên giả lập)
INSERT INTO KIEMKE (ID_QuanLyKho, ID_NguyenLieu, ThoiGian, SoLuongHeThong, SoLuongThucTe, TinhTrang, DaXuLy) VALUES
(7, 1, '2023-10-30', 50.5, 50.0, N'Hao hụt tự nhiên', 1),
(7, 2, '2023-10-30', 100.0, 98.0, N'Hư hỏng nhẹ', 1),
(7, 3, '2023-10-30', 30.0, 30.0, N'Đủ', 1),
(7, 4, '2023-10-30', 500.0, 495.0, N'Chuột cắn bao bì', 0),
(7, 5, '2023-10-30', 20.0, 15.0, N'Héo, bỏ', 1),
(7, 6, '2023-10-30', 15.0, 15.0, N'Đủ', 1),
(7, 7, '2023-10-30', 200.0, 200.0, N'Đủ', 1),
(7, 8, '2023-10-30', 500.0, 490.0, N'Vỡ khi vận chuyển', 1),
(7, 9, '2023-10-30', 50.0, 50.0, N'Đủ', 1),
(7, 10, '2023-10-30', 100.0, 99.0, N'Đổ', 1),
(7, 11, '2023-10-30', 40.0, 40.0, N'Đủ', 1),
(7, 12, '2023-10-30', 40.0, 38.0, N'Hết hạn', 0),
(7, 13, '2023-10-30', 25.0, 25.0, N'Đủ', 1),
(7, 14, '2023-10-30', 10.0, 9.5, N'Hao hụt', 1),
(7, 15, '2023-10-30', 50.0, 50.0, N'Đủ', 1);

-- 12. DATBAN
INSERT INTO DATBAN (SoLuongKhach, ThoiGianDat, TrangThai, GhiChu, ID_LeTan, SDT_Khach, ID_Ban) VALUES
(4, '2023-11-01 18:00', N'Đã nhận bàn', N'Sinh nhật', 5, '0987654322', 3),
(2, '2023-11-01 19:00', N'Đã hủy', N'Khách bận', 6, '0987654323', NULL),
(10, '2023-11-02 12:00', N'Đã đặt', N'Công ty', 5, '0987654327', 14),
(6, '2023-11-02 18:30', N'Đã nhận bàn', NULL, 6, '0987654331', 7),
(2, '2023-11-03 19:00', N'Đã đặt', NULL, 5, '0987654333', 1),
(4, '2023-11-03 20:00', N'Đã đặt', N'Gần cửa sổ', 6, '0987654324', 4),
(8, '2023-11-04 11:00', N'Đã nhận bàn', NULL, 5, '0987654329', 8),
(2, '2023-11-04 12:00', N'Đã đặt', NULL, 6, '0987654335', 2),
(6, '2023-11-05 18:00', N'Đã hủy', N'Mưa', 5, '0987654322', NULL),
(10, '2023-11-05 19:00', N'Đã nhận bàn', N'Tiệc', 6, '0987654327', 10),
(4, '2023-11-06 12:00', N'Đã đặt', NULL, 5, '0987654331', 12),
(2, '2023-11-06 13:00', N'Đã đặt', NULL, 6, '0987654323', 11),
(8, '2023-11-07 18:00', N'Đã nhận bàn', NULL, 5, '0987654329', 9),
(6, '2023-11-07 19:00', N'Đã đặt', NULL, 6, '0987654333', 6),
(4, '2023-11-08 12:00', N'Đã nhận bàn', NULL, 5, '0987654324', 5);

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
(2, 15, 4, '2023-10-15 11:00:00', '2023-10-15 14:00:00', N'Sửa', N'Đã duyệt', N'Gỏi Cuốn Tôm (Size Lớn)', 20000, N'Tôm thẻ to, thịt ba rọi rút sườn', NULL, N'Nâng cấp chất lượng món');

-- 18. BAOCAODOANHTHU
INSERT INTO BAOCAODOANHTHU (ThoiGianLap, LoaiBaoCao, Ky, Nam, TongDoanhThu, TongChiPhi) VALUES
('2023-10-31', N'Tháng', 10, 2023, 150000000, 80000000),
('2023-11-08', N'Tháng', 11, 2023, 50000000, 20000000), -- Số liệu giả định
('2023-03-31', N'Quý', 1, 2023, 400000000, 200000000),
('2023-06-30', N'Quý', 2, 2023, 450000000, 220000000),
('2023-09-30', N'Quý', 3, 2023, 420000000, 210000000),
('2022-12-31', N'Năm', 2022, 2022, 1500000000, 700000000),
('2023-10-01', N'Tuần', 40, 2023, 35000000, 15000000), -- Ví dụ nếu có báo cáo tuần
('2023-10-08', N'Tuần', 41, 2023, 38000000, 16000000),
('2023-10-15', N'Tuần', 42, 2023, 40000000, 18000000),
('2023-10-22', N'Tuần', 43, 2023, 37000000, 15000000),
('2023-10-29', N'Tuần', 44, 2023, 42000000, 19000000),
('2023-11-05', N'Tuần', 45, 2023, 20000000, 8000000),
('2023-01-31', N'Tháng', 1, 2023, 120000000, 60000000),
('2023-02-28', N'Tháng', 2, 2023, 130000000, 65000000),
('2023-04-30', N'Tháng', 4, 2023, 140000000, 70000000);
/* Add constraints */

ALTER TABLE NHANVIEN
ADD
	CONSTRAINT FK_NHANVIEN_GIAMSAT FOREIGN KEY (ID_Giamsat) REFERENCES NHANVIEN(ID),
	CONSTRAINT CK_NO_SELF_SUPERVISION CHECK (ID_Giamsat <> ID);

ALTER TABLE SDT_NHANVIEN
ADD
	CONSTRAINT FK_SDT_NHANVIEN FOREIGN KEY (ID_Nhanvien) REFERENCES NHANVIEN(ID)
	ON DELETE CASCADE;

ALTER TABLE KHACHHANG
ADD
    CONSTRAINT CK_IF_THANHVIEN CHECK (
        (Flag_ThanhVien = 0 
        AND Email IS NULL 
        AND NgaySinh IS NULL 
        AND GioiTinh IS NULL 
        AND HangThanhVien IS NULL
        AND DiemTichLuy IS NULL)
        OR
        (Flag_ThanhVien = 1 
        AND Email IS NOT NULL
        AND NgaySinh IS NOT NULL
        AND GioiTinh IS NOT NULL
        AND HangThanhVien IS NOT NULL
        AND DiemTichLuy IS NOT NULL)
    );

-- Xem xét việc check format email (dùng hàm để chuẩn hóa)

ALTER TABLE SDT_NHACUNGCAP
ADD 
    CONSTRAINT FK_SDT_NCC FOREIGN KEY (ID_Nha_Cung_Cap) REFERENCES NHACUNGCAP(ID)
    ON DELETE CASCADE;

ALTER TABLE CUNGCAP
ADD 
    CONSTRAINT FK_CUNGCAP_NCC FOREIGN KEY (ID_NhaCungCap) REFERENCES NHACUNGCAP(ID),
    CONSTRAINT FK_CUNGCAP_NL FOREIGN KEY (ID_NguyenLieu) REFERENCES NGUYENLIEU(ID);

ALTER TABLE KIEMKE
ADD 
    CONSTRAINT CK_KIEMKE_SOLUONG CHECK (SoLuongHeThong >= 0 AND SoLuongThucTe >= 0),
    -- Sẽ có cơ chế Trigger để fill SoLuongHeThong
    CONSTRAINT FK_KIEMKE_QLK FOREIGN KEY (ID_QuanLyKho) REFERENCES QUANLYKHO(ID),
    CONSTRAINT FK_KIEMKE_NL FOREIGN KEY (ID_NguyenLieu) REFERENCES NGUYENLIEU(ID);

ALTER TABLE BAOCAODOANHTHU ADD
    CONSTRAINT FK_BCD_QLY FOREIGN KEY (ID_QuanLy) REFERENCES NHANVIEN(ID);

ALTER TABLE QUANLY ADD
    CONSTRAINT FK_QUANLY_NHANVIEN FOREIGN KEY (ID) REFERENCES NHANVIEN(ID);

ALTER TABLE BEPTRUONG ADD
    CONSTRAINT FK_BEPTRUONG_NHANVIEN FOREIGN KEY (ID) REFERENCES NHANVIEN(ID);

ALTER TABLE PHUCVU ADD
    CONSTRAINT FK_PHUCVU_NHANVIEN FOREIGN KEY (ID) REFERENCES NHANVIEN(ID);

ALTER TABLE LETAN ADD
    CONSTRAINT FK_LE_TAN_NHANVIEN FOREIGN KEY (ID) REFERENCES NHANVIEN(ID);

ALTER TABLE QUANLYKHO ADD
    CONSTRAINT FK_QUANLYKHO_NHANVIEN FOREIGN KEY (ID) REFERENCES NHANVIEN(ID);

ALTER TABLE DATBAN ADD
    CONSTRAINT FK_DATBAN_LETAN FOREIGN KEY (ID_LeTan) REFERENCES LETAN(ID),
    CONSTRAINT FK_DATBAN_BAN FOREIGN KEY (ID_Ban) REFERENCES BAN(ID_Ban),
    CONSTRAINT FK_DATBAN_KHACH FOREIGN KEY (SDT_Khach) REFERENCES KHACHHANG(SDT);

ALTER TABLE DONGOIMON ADD
    CONSTRAINT FK_DONBAN_BAN FOREIGN KEY (ID_Ban) REFERENCES BAN(ID_Ban),
    CONSTRAINT FK_DONBAN_PHUCVU FOREIGN KEY (ID_PhucVu) REFERENCES PHUCVU(ID);

ALTER TABLE LANGOIMON ADD
    CONSTRAINT FK_LANGOI_DON FOREIGN KEY (ID_Don) REFERENCES DONGOIMON(ID),
    CONSTRAINT FK_LANGOI_PHUCVU FOREIGN KEY (ID_PhucVu) REFERENCES PHUCVU(ID),
    CONSTRAINT FK_LANGOI_BEPTRUONG FOREIGN KEY (ID_BepTruong) REFERENCES BEPTRUONG(ID);

ALTER TABLE LANGOIMON_MON ADD
    CONSTRAINT FK_LANGOI_ITEM_LAN FOREIGN KEY (ID_LanGoi) REFERENCES LANGOIMON(ID),
    CONSTRAINT FK_LANGOI_ITEM_MON FOREIGN KEY (ID_MonAn) REFERENCES MONAN(ID);

ALTER TABLE THANHTOAN ADD
    CONSTRAINT FK_THANHTOAN_DON FOREIGN KEY (ID_Don) REFERENCES DONGOIMON(ID),
    CONSTRAINT FK_THANHTOAN_LETAN FOREIGN KEY (ID_LeTan) REFERENCES LETAN(ID),
    CONSTRAINT FK_THANHTOAN_KHACH FOREIGN KEY (SDT_Khach) REFERENCES KHACHHANG(SDT);

ALTER TABLE CAPNHAT_MONAN ADD
    CONSTRAINT FK_CAPNHAT_BEPTRUONG FOREIGN KEY (ID_BepTruong) REFERENCES BEPTRUONG(ID),
    CONSTRAINT FK_CAPNHAT_QUANLY FOREIGN KEY (ID_QuanLy) REFERENCES QUANLY(ID),
    CONSTRAINT FK_CAPNHAT_MON FOREIGN KEY (ID_MonAn) REFERENCES MONAN(ID);

GO
/* Triggers & Procedures */
CREATE TRIGGER trg_ChiMotQuanLyActive
ON QUANLY
FOR INSERT, UPDATE
AS
BEGIN
    -- Logic: Kiểm tra nếu có dòng vừa thêm/sửa mà NgayKetThuc IS NULL (Đang tại chức)
    IF EXISTS (SELECT 1 FROM inserted WHERE NgayKetThuc IS NULL)
    BEGIN
        -- Đếm xem có bao nhiêu người đang tại chức trong toàn bảng
        DECLARE @CountActive INT;
        SELECT @CountActive = COUNT(*) FROM QUANLY WHERE NgayKetThuc IS NULL;

        -- Nếu > 1 người -> Lỗi
        IF @CountActive > 1
        BEGIN
            RAISERROR (N'Lỗi nghiệp vụ: Tại một thời điểm chỉ được phép có 1 Quản Lý đang tại chức.', 16, 1);
            ROLLBACK TRANSACTION;
        END
    END
END;

GO
CREATE TRIGGER trg_ChiMotBepTruongActive
ON BEPTRUONG
FOR INSERT, UPDATE
AS
BEGIN
    IF EXISTS (SELECT 1 FROM inserted WHERE NgayKetThuc IS NULL)
    BEGIN
        DECLARE @CountActive INT;
        SELECT @CountActive = COUNT(*) FROM BEPTRUONG WHERE NgayKetThuc IS NULL;

        IF @CountActive > 1
        BEGIN
            RAISERROR (N'Lỗi nghiệp vụ: Tại một thời điểm chỉ được phép có 1 Bếp Trưởng đang tại chức.', 16, 1);
            ROLLBACK TRANSACTION;
        END
    END
END;

GO
-- PROCEDURE: thêm nhân viên
CREATE PROCEDURE sp_ThemNhanVien
    -- THÔNG TIN CƠ BẢN (Bắt buộc)
    @CCCD               VARCHAR(12),
    @HoTen              NVARCHAR(200),
    @NgaySinh           DATE,
    @NgayVaoLam         DATE,
    @Luong              DECIMAL(12,2),
    @DiaChi             NVARCHAR(300),
    @ChucDanh           NVARCHAR(50),
    @LoaiHinhLamViec    NVARCHAR(50),
    @SDT_Chinh          VARCHAR(20), -- SĐT đầu tiên để liên lạc
    
    @ID_GiamSat         INT = NULL,

    -- THÔNG TIN KHÁC (Không bắt buộc)
    @NgayNhanChuc       DATE = NULL,        
    @ChuyenMon          NVARCHAR(50) = NULL,
    @CaLamViec          NVARCHAR(20) = NULL,
    @NhomNguyenLieu     NVARCHAR(20) = NULL, 
    @NgoaiNgu           NVARCHAR(100) = NULL 
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- ========================================================
        -- A. VALIDATE DOMAIN & DATA INTEGRITY (Kiểm tra dữ liệu)
        -- ========================================================

        -- 1. Validate Tuổi (>= 18)
        IF (DATEDIFF(DAY, @NgaySinh, GETDATE()) / 365.25 < 18)
            THROW 50001, N'Lỗi: Nhân viên phải từ 18 tuổi trở lên.', 1;

        -- 2. Validate SĐT (Định dạng)
        IF LEN(@SDT_Chinh) < 10 OR @SDT_Chinh LIKE '%[^0-9]%'
            THROW 50002, N'Lỗi: Số điện thoại không hợp lệ.', 1;
        
        -- 3. Validate Trùng SĐT (Trong bảng SDT)
        IF EXISTS (SELECT 1 FROM SDT_NHANVIEN WHERE SDT = @SDT_Chinh)
            THROW 50003, N'Lỗi: Số điện thoại này đã tồn tại trong hệ thống.', 1;

        -- 4. Validate Trùng CCCD
        IF EXISTS (SELECT 1 FROM NHANVIEN WHERE CCCD = @CCCD)
            THROW 50004, N'Lỗi: Số CCCD này đã tồn tại.', 1;

        -- 5. Validate Lương
        IF @Luong <= 0
            THROW 50005, N'Lỗi: Lương phải lớn hơn 0.', 1;

        -- ========================================================
        -- B. VALIDATE BUSINESS LOGIC (Nghiệp vụ chức danh)
        -- ========================================================
        
        -- 1. Ngày nhận chức không được nhỏ hơn ngày vào làm
        IF @NgayNhanChuc IS NOT NULL AND @NgayNhanChuc < @NgayVaoLam
            THROW 50006, N'Lỗi: Ngày nhận chức không được trước Ngày vào làm.', 1;

        -- 2. Logic Giám sát (ID_GiamSat)
        IF @ID_GiamSat IS NOT NULL
        BEGIN
            -- Check tồn tại
            IF NOT EXISTS (SELECT 1 FROM NHANVIEN WHERE ID = @ID_GiamSat)
                THROW 50007, N'Lỗi: ID Giám sát không tồn tại.', 1;
            
            -- Cấp cao nhất không có giám sát
            IF @ChucDanh IN (N'Quản lý', N'Bếp trưởng')
                THROW 50008, N'Lỗi: Quản lý và Bếp trưởng là cấp cao nhất, không nhập người giám sát.', 1;
        END

        -- 3. Logic riêng từng chức danh
        IF @ChucDanh = N'Phục vụ' AND @CaLamViec IS NULL
            THROW 50009, N'Lỗi: Nhân viên Phục vụ bắt buộc phải có Ca làm việc.', 1;
            
        IF @ChucDanh = N'Lễ tân' AND ISNULL(@NgoaiNgu, '') = ''
            THROW 50010, N'Lỗi: Lễ tân bắt buộc phải có thông tin Ngoại ngữ.', 1;

        -- Logic đặc biệt: Đầu bếp phải do Bếp trưởng giám sát
        IF @ChucDanh = N'Đầu bếp'
        BEGIN
            IF @ID_GiamSat IS NULL
                THROW 50011, N'Lỗi: Đầu bếp bắt buộc phải có người giám sát (Bếp trưởng).', 1;
            
            -- Kiểm tra người giám sát có phải là Bếp trưởng không
            IF NOT EXISTS (SELECT 1 FROM NHANVIEN WHERE ID = @ID_GiamSat AND ChucDanh = N'Bếp trưởng')
                THROW 50012, N'Lỗi: Người giám sát của Đầu bếp phải là một Bếp trưởng.', 1;
        END

        -- ========================================================
        -- C. EXECUTION (Thực thi Insert)
        -- ========================================================

        -- BƯỚC 1: Insert Bảng Cha (NHANVIEN)
        DECLARE @NewID INT;
        INSERT INTO NHANVIEN (CCCD, HoTen, NgaySinh, NgayVaoLam, Luong, DiaChi, ChucDanh, LoaiHinhLamViec, ID_GiamSat)
        VALUES (@CCCD, @HoTen, @NgaySinh, @NgayVaoLam, @Luong, @DiaChi, @ChucDanh, @LoaiHinhLamViec, @ID_GiamSat);

        SET @NewID = SCOPE_IDENTITY();

        -- BƯỚC 2: Insert SĐT Chính
        INSERT INTO SDT_NHANVIEN (ID_NhanVien, SDT)
        VALUES (@NewID, @SDT_Chinh);

        -- BƯỚC 3: Insert Bảng Con (Phân loại chức danh)
        IF @ChucDanh = N'Quản lý'
        BEGIN
            -- Nếu không nhập ngày nhận chức, mặc định là ngày vào làm
            INSERT INTO QUANLY (ID, NgayNhanChuc) 
            VALUES (@NewID, ISNULL(@NgayNhanChuc, @NgayVaoLam));
        END
        ELSE IF @ChucDanh = N'Bếp trưởng'
        BEGIN
            INSERT INTO BEPTRUONG (ID, ChuyenMon, NgayNhanChuc) 
            VALUES (@NewID, @ChuyenMon, ISNULL(@NgayNhanChuc, @NgayVaoLam));
        END
        ELSE IF @ChucDanh = N'Phục vụ'
        BEGIN
            INSERT INTO PHUCVU (ID, CaLamViec) 
            VALUES (@NewID, @CaLamViec);
        END
        ELSE IF @ChucDanh = N'Lễ tân'
        BEGIN
            INSERT INTO LETAN (ID, NgoaiNgu) 
            VALUES (@NewID, @NgoaiNgu);
        END
        ELSE IF @ChucDanh = N'Quản lý kho'
        BEGIN
            INSERT INTO QUANLYKHO (ID, NhomNguyenLieu) 
            VALUES (@NewID, @NhomNguyenLieu);
        END

        -- Hoàn tất
        COMMIT TRANSACTION;
        PRINT N'Thêm nhân viên thành công! Mã nhân viên mới: ' + CAST(@NewID AS NVARCHAR(20));

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR (@ErrorMessage, 16, 1);
    END CATCH
END;

GO
CREATE PROCEDURE sp_CapNhatNhanVien
    @ID                 INT,
    -- THÔNG TIN CHUNG (Optional - Truyền NULL nếu không sửa)
    @HoTen              NVARCHAR(200) = NULL,
    @NgaySinh           DATE = NULL,
    @Luong              DECIMAL(12,2) = NULL,
    @DiaChi             NVARCHAR(300) = NULL,
    @SDT                VARCHAR(20) = NULL, -- Update SĐT chính
    @LoaiHinhLamViec    NVARCHAR(50) = NULL,
    @ID_GiamSat         INT = NULL, -- Có thể đổi người giám sát
    
    -- CHỨC DANH (Xử lý riêng -> nếu khác chức danh cũ -> Kích hoạt logic chuyển đổi)
    @ChucDanhMoi        NVARCHAR(50) = NULL,

    -- THÔNG TIN RIÊNG (Dùng để update hoặc cung cấp cho chức danh mới)
    @NgayNhanChuc       DATE = NULL,
    @ChuyenMon          NVARCHAR(50) = NULL,
    @CaLamViec          NVARCHAR(20) = NULL,
    @NhomNguyenLieu     NVARCHAR(20) = NULL,
    @NgoaiNgu           NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- =============================================
        -- A. KIỂM TRA TỒN TẠI & DATA CŨ
        -- =============================================
        IF NOT EXISTS (SELECT 1 FROM NHANVIEN WHERE ID = @ID)
            THROW 50001, N'Lỗi: Nhân viên không tồn tại.', 1;

        -- Lấy dữ liệu cũ để so sánh
        DECLARE @ChucDanhCu NVARCHAR(50), @NgayNghiViec DATE;
        SELECT @ChucDanhCu = ChucDanh, @NgayNghiViec = NgayNghiViec 
        FROM NHANVIEN WHERE ID = @ID;

        -- Chặn update nếu nhân viên đã nghỉ việc (Soft delete protection)
        IF @NgayNghiViec IS NOT NULL
            THROW 50002, N'Lỗi: Không thể cập nhật thông tin nhân viên đã nghỉ việc.', 1;

        -- Nếu không truyền chức danh mới, mặc định là chức danh cũ
        SET @ChucDanhMoi = ISNULL(@ChucDanhMoi, @ChucDanhCu);

        -- =============================================
        -- B. VALIDATE DỮ LIỆU
        -- =============================================
        -- Validate Lương (Nếu có update)
        IF @Luong IS NOT NULL AND @Luong < 0
            THROW 50003, N'Lỗi: Lương không được âm.', 1;

        -- Validate Giám sát (Không tự giám sát mình)
        IF @ID_GiamSat IS NOT NULL AND @ID_GiamSat = @ID
            THROW 50004, N'Lỗi: Nhân viên không thể tự giám sát chính mình.', 1;

        -- =============================================
        -- C. TRƯỜNG HỢP 1: CÓ THAY ĐỔI CHỨC DANH
        -- =============================================
        IF @ChucDanhMoi <> @ChucDanhCu
        BEGIN
            -- 1. Validate điều kiện cho chức danh MỚI
            IF @ChucDanhMoi = N'Phục vụ' AND @CaLamViec IS NULL
                 THROW 50005, N'Lỗi: Chuyển sang Phục vụ cần nhập Ca làm việc.', 1;
            
            IF @ChucDanhMoi IN (N'Quản lý', N'Bếp trưởng') AND @NgayNhanChuc IS NULL
                 THROW 50006, N'Lỗi: Chuyển sang Quản lý/Bếp trưởng cần nhập Ngày nhận chức.', 1;

            IF @ChucDanhMoi = N'Lễ tân' AND @NgoaiNgu IS NULL
                 THROW 50005, N'Lỗi: Chuyển sang Lễ tân cần nhập Ngoại ngữ.', 1;
            -- 2. Xóa dữ liệu ở bảng con CŨ
            IF @ChucDanhCu = N'Quản lý' DELETE FROM QUANLY WHERE ID = @ID;
            ELSE IF @ChucDanhCu = N'Bếp trưởng' DELETE FROM BEPTRUONG WHERE ID = @ID;
            ELSE IF @ChucDanhCu = N'Phục vụ' DELETE FROM PHUCVU WHERE ID = @ID;
            ELSE IF @ChucDanhCu = N'Lễ tân' 
            BEGIN
                DELETE FROM LETAN_NGOAINGU WHERE ID_LeTan = @ID;
                DELETE FROM LETAN WHERE ID = @ID;
            END
            ELSE IF @ChucDanhCu = N'Quản lý kho' DELETE FROM QUANLYKHO WHERE ID = @ID;

            -- 3. Tạo dữ liệu ở bảng con MỚI
            IF @ChucDanhMoi = N'Quản lý' 
                INSERT INTO QUANLY (ID, NgayNhanChuc) VALUES (@ID, ISNULL(@NgayNhanChuc, GETDATE()));
            ELSE IF @ChucDanhMoi = N'Bếp trưởng' 
                INSERT INTO BEPTRUONG (ID, ChuyenMon, NgayNhanChuc) VALUES (@ID, @ChuyenMon, ISNULL(@NgayNhanChuc, GETDATE()));
            ELSE IF @ChucDanhMoi = N'Phục vụ' 
                INSERT INTO PHUCVU (ID, CaLamViec) VALUES (@ID, @CaLamViec);
            ELSE IF @ChucDanhMoi = N'Lễ tân' 
            BEGIN
                INSERT INTO LETAN (ID, NgoaiNgu) VALUES (@ID, ISNULL(@NgoaiNgu, NULL));
            END
            ELSE IF @ChucDanhMoi = N'Quản lý kho' 
                INSERT INTO QUANLYKHO (ID, NhomNguyenLieu) VALUES (@ID, ISNULL(@NhomNguyenLieu, N'Chung'));
        END
        ELSE 
        -- =============================================
        -- D. TRƯỜNG HỢP 2: KHÔNG ĐỔI CHỨC DANH (UPDATE BẢNG CON HIỆN TẠI)
        -- =============================================
        BEGIN
            IF @ChucDanhCu = N'Quản lý' 
                UPDATE QUANLY SET NgayNhanChuc = ISNULL(@NgayNhanChuc, NgayNhanChuc) WHERE ID = @ID;
            ELSE IF @ChucDanhCu = N'Bếp trưởng'
            BEGIN
                UPDATE BEPTRUONG SET NgayNhanChuc = ISNULL(@NgayNhanChuc, NgayNhanChuc) WHERE ID = @ID;
                UPDATE BEPTRUONG SET ChuyenMon = ISNULL(@ChuyenMon, ChuyenMon), NgayNhanChuc = ISNULL(@NgayNhanChuc, NgayNhanChuc) WHERE ID = @ID;
            END
            ELSE IF @ChucDanhCu = N'Phục vụ'
                UPDATE PHUCVU SET CaLamViec = ISNULL(@CaLamViec, CaLamViec) WHERE ID = @ID;
            ELSE IF @ChucDanhCu = N'Quản lý kho'
                UPDATE QUANLYKHO SET NhomNguyenLieu = ISNULL(@NhomNguyenLieu, NhomNguyenLieu) WHERE ID = @ID;
            ELSE IF @ChucDanhCu = N'Lễ tân'
                UPDATE LETAN SET NgoaiNgu = ISNULL(@NgoaiNgu, NgoaiNgu) WHERE ID = @ID;
        END

        -- =============================================
        -- E. UPDATE BẢNG CHA & SĐT (CHUNG)
        -- =============================================
        UPDATE NHANVIEN
        SET HoTen = ISNULL(@HoTen, HoTen),
            NgaySinh = ISNULL(@NgaySinh, NgaySinh),
            Luong = ISNULL(@Luong, Luong),
            DiaChi = ISNULL(@DiaChi, DiaChi),
            LoaiHinhLamViec = ISNULL(@LoaiHinhLamViec, LoaiHinhLamViec),
            ChucDanh = @ChucDanhMoi, -- Cập nhật chức danh mới (nếu có đổi)
            ID_GiamSat = ISNULL(@ID_GiamSat, ID_GiamSat)
        WHERE ID = @ID;

        -- Update SĐT Chính (Lấy số đầu tiên tìm thấy để update nếu chưa có logic SĐT chính/phụ cụ thể)
        -- Lưu ý: Đây là xử lý đơn giản hóa. Nếu muốn chuẩn phải có ID SĐT.
        IF @SDT IS NOT NULL
        BEGIN
            UPDATE TOP(1) SDT_NHANVIEN 
            SET SDT = @SDT 
            WHERE ID_NhanVien = @ID;
        END

        COMMIT TRANSACTION;
        PRINT N'Cập nhật thông tin thành công!';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;

GO
CREATE PROCEDURE sp_XoaNhanVien
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        -- Kiểm tra ID có tồn tại không
        IF NOT EXISTS (SELECT 1 FROM NHANVIEN WHERE ID = @ID)
            THROW 50001, N'Lỗi: Nhân viên không tồn tại trong hệ thống.', 1;
        -- Kiểm tra xem nhân viên này đã nghỉ việc chưa? (Tránh xóa mềm 2 lần)
        IF EXISTS (SELECT 1 FROM NHANVIEN WHERE ID = @ID AND NgayNghiViec IS NOT NULL)
            THROW 50002, N'Lỗi: Nhân viên này đã nghỉ việc rồi, không thể xóa lần nữa.', 1;

        -- Nếu nhân viên này đang giám sát người khác -> Gỡ bỏ quyền giám sát
        IF EXISTS (SELECT 1 FROM NHANVIEN WHERE ID_GiamSat = @ID)
        BEGIN
            UPDATE NHANVIEN 
            SET ID_GiamSat = NULL 
            WHERE ID_GiamSat = @ID;
        END

        -- Thực hiện xóa mềm (Soft Delete)
        -- A. Update bảng Cha (NHANVIEN)
        UPDATE NHANVIEN
        SET NgayNghiViec = GETDATE(), 
            ID_GiamSat = NULL 
        WHERE ID = @ID;

        -- B. Update bảng Con
        IF EXISTS (SELECT 1 FROM QUANLY WHERE ID = @ID)
        BEGIN
            UPDATE QUANLY 
            SET NgayKetThuc = GETDATE() 
            WHERE ID = @ID AND NgayKetThuc IS NULL; 
        END

        IF EXISTS (SELECT 1 FROM BEPTRUONG WHERE ID = @ID)
        BEGIN
            UPDATE BEPTRUONG 
            SET NgayKetThuc = GETDATE() 
            WHERE ID = @ID AND NgayKetThuc IS NULL;
        END

        COMMIT TRANSACTION;
        PRINT N'Đã thực hiện xóa mềm (cho nghỉ việc) nhân viên thành công.';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR (@ErrorMessage, 16, 1);
    END CATCH
END;

-- Xử lý SĐT phụ
GO
CREATE PROCEDURE sp_ThemSDT_Phu
    @ID_NhanVien INT,
    @SDT_Phu     VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Validate: Nhân viên có tồn tại không? (Check FK)
        IF NOT EXISTS (SELECT 1 FROM NHANVIEN WHERE ID = @ID_NhanVien)
            THROW 50020, N'Lỗi: ID Nhân viên không tồn tại.', 1;

        -- 2. Validate: Định dạng SĐT hợp lệ?
        IF LEN(@SDT_Phu) < 10 OR @SDT_Phu LIKE '%[^0-9]%'
            THROW 50021, N'Lỗi: Định dạng số điện thoại không hợp lệ (Phải là số và >= 10 ký tự).', 1;
        
        -- 3. Validate: Số điện thoại đã được sử dụng chưa? (Check Unique)
        IF EXISTS (SELECT 1 FROM SDT_NHANVIEN WHERE SDT = @SDT_Phu)
            THROW 50022, N'Lỗi: Số điện thoại này đã được sử dụng bởi một nhân viên khác.', 1;

        -- 4. Thực hiện INSERT
        INSERT INTO SDT_NHANVIEN (ID_NhanVien, SDT)
        VALUES (@ID_NhanVien, @SDT_Phu);
        
        COMMIT TRANSACTION;
        PRINT N'Đã thêm số điện thoại phụ (' + @SDT_Phu + N') thành công cho nhân viên ID ' + CAST(@ID_NhanVien AS NVARCHAR(20));
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR (@ErrorMessage, 16, 1);
    END CATCH
END;

GO
CREATE PROCEDURE sp_XoaSDT_Phu
    @ID_NhanVien INT,
    @SDT_Phu     VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Validate: Kiểm tra xem số điện thoại có tồn tại cho nhân viên này không
        IF NOT EXISTS (SELECT 1 FROM SDT_NHANVIEN WHERE ID_NhanVien = @ID_NhanVien AND SDT = @SDT_Phu)
            THROW 50024, N'Lỗi: Số điện thoại này không tồn tại cho nhân viên ID ', 1;

        -- 2. Validate: Kiểm tra nghiệp vụ - Phải có ít nhất một SĐT (ngăn xóa số cuối cùng)
        IF (SELECT COUNT(*) FROM SDT_NHANVIEN WHERE ID_NhanVien = @ID_NhanVien) = 1
            THROW 50023, N'Lỗi: Không thể xóa số điện thoại này. Nhân viên phải có ít nhất một số liên lạc.', 1;

        -- 3. Thực hiện DELETE
        DELETE FROM SDT_NHANVIEN
        WHERE ID_NhanVien = @ID_NhanVien AND SDT = @SDT_Phu;
        
        COMMIT TRANSACTION;
        PRINT N'Đã xóa số điện thoại phụ (' + @SDT_Phu + N') thành công.';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR (@ErrorMessage, 16, 1);
    END CATCH
END;