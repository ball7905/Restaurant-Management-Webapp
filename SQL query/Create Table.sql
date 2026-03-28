USE DB_RESTAURANT

CREATE TABLE NHANVIEN (
    ID              INT IDENTITY(1,1)       PRIMARY KEY, -- Xử lý format khác trên BE
    CCCD            VARCHAR(12)             NOT NULL UNIQUE,

    Username        VARCHAR(50)             NOT NULL UNIQUE,
    Password        VARCHAR(255)            NOT NULL,

    HoTen           NVARCHAR(200)           NOT NULL,
    NgaySinh        DATE                    NOT NULL,
    NgayVaoLam      DATE                    NOT NULL DEFAULT GETUTCDATE(),
    NgayNghiViec    DATE,
    Luong           DECIMAL(12,2)           NOT NULL CHECK (Luong > 0),
    DiaChi          NVARCHAR(300),
    ChucDanh        NVARCHAR(50)            NOT NULL CHECK (ChucDanh IN (N'Quản lý',N'Bếp trưởng',N'Đầu bếp',N'Phục vụ',N'Lễ tân',N'Quản lý kho')),
    LoaiHinhLamViec NVARCHAR(50)            NULL,
    ID_GiamSat      INT                     NULL,

    CONSTRAINT CK_NHANVIEN_CCCD CHECK (LEN(CCCD) = 12 AND CCCD NOT LIKE '%[^0-9]%'),
    CONSTRAINT CK_NHANVIEN_AGE CHECK (DATEDIFF(DAY, NgaySinh, GETUTCDATE())/365.25 >= 18), -- Xét theo ngày
    CONSTRAINT CK_NHANVIEN_NGAYVAOLAM CHECK (NgayVaoLam <= CONVERT(date, GETUTCDATE()))
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
    NgayNhanChuc    DATE                NOT NULL DEFAULT GETUTCDATE(), -- Cần check điều kiện với NgayVaoLam
    NgayKetThuc     DATE                NULL
);

CREATE TABLE BEPTRUONG (
    ID              INT                 PRIMARY KEY,
    ChuyenMon       NVARCHAR(50)        NULL,
    NgayNhanChuc    DATE                NOT NULL DEFAULT GETUTCDATE(), -- Cần check điều kiện với NgayVaoLam
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
    ID_PhucVu       INT                 NULL,
    TongTienTamTinh DECIMAL(18, 0)      DEFAULT 0
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
    ThanhTien       AS (SoLuong * DonGiaThoiDiem) PERSISTED
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
    ThanhTien           AS (TongTienMon - GiamGia) PERSISTED
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

-- Tạo bảng NGUYENLIEU_MONAN -------------------
-- Dùng để lưu nguyên liệu cần dùng cho mỗi món ăn (công thức chế biến)
--CREATE TABLE NGUYENLIEU_MONAN (
--    ID                  INT IDENTITY(1,1)   PRIMARY KEY,
--    ID_MonAN            INT             NOT NULL,
--    ID_NguyenLieu       INT             NOT NULL,
--    SoLuongNgLieuDung   DECIMAL(12,0)   NOT NULL CHECK (SoLuongNgLieuDung > 0),
--    DonViTinh           NVARCHAR(500)   NOT NULL
--);