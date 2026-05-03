--TRIGGER cho constraint "Chỉ được phép gọi món ở trạng thái Còn (= 1)"
-----TRIGGER khi insert vào LANGOIMON_MON----
GO
CREATE TRIGGER trg_KiemTraMonAnConHang_Insert
ON LANGOIMON_MON
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra xem có món nào trong inserted đang hết không
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN MONAN m ON i.ID_MonAn = m.ID
        WHERE m.DangPhucVu = 0   -- 0 = Hết
    )
    BEGIN
        RAISERROR (N'Món ăn được chọn tạm thời không phục vụ. Vui lòng kiểm tra lại thực đơn!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- Nếu tất cả món đều còn → cho phép insert
    INSERT INTO LANGOIMON_MON (ID_LanGoi, ID_MonAn, SoLuong, DonGiaThoiDiem)
    SELECT ID_LanGoi, ID_MonAn, SoLuong, DonGiaThoiDiem
    FROM inserted;
END;

-----TRIGGER khi UPDATE col ID_MonAn trong table LANGOIMON_MON (TH: thay món ăn)-------

GO
CREATE TRIGGER trg_KiemTraMonAnConHang_Update
ON LANGOIMON_MON
FOR UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Chỉ kiểm tra khi cột ID_MonAn bị thay đổi
    IF UPDATE(ID_MonAn)
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM inserted i
            JOIN MONAN m ON i.ID_MonAn = m.ID
            WHERE m.DangPhucVu = 0
        )
        BEGIN
            RAISERROR (N'Món ăn vừa đổi hiện tạm thời không phục vụ!', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
    END

    -- Nếu không vi phạm thì cho phép update bình thường
END;

--TRIGGER cho thuộc tính dẫn xuất: chọn thuộc tính TrangThai của table MONAN--------------------------------------------------
----TRIGGER: TH1 khi cập nhật số lượng tồn kho cho nguyên liệu---------------------------------------------------------------------

GO
CREATE OR ALTER TRIGGER trg_CapNhat_SoLuongNguyenLieuTonKho
ON CHUA
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Lấy danh sách các nguyên liệu có sự thay đổi số lượng trong kho
    DECLARE @AffectedNL TABLE (ID_NL INT);
    INSERT INTO @AffectedNL
    SELECT DISTINCT ID_NguyenLieu FROM inserted
    UNION
    SELECT DISTINCT ID_NguyenLieu FROM deleted;

    -- Tìm tất cả các món ăn sử dụng các nguyên liệu này
    ;WITH MonAnBiAnhHuong AS (
        SELECT DISTINCT nm.ID_MonAn
        FROM @AffectedNL a
        JOIN NGUYENLIEU_MONAN nm ON nm.ID_NguyenLieu = a.ID_NL
    )
    -- Cập nhật trạng thái MONAN dựa trên tổng tồn kho thực tế từ tất cả các kho
    UPDATE MONAN
    SET DangPhucVu = CASE 
        WHEN NOT EXISTS (
            SELECT 1
            FROM NGUYENLIEU_MONAN nlm
            WHERE nlm.ID_MonAn = MONAN.ID
              AND dbo.fn_LayTongSoLuongNguyenLieu(nlm.ID_NguyenLieu) < nlm.SoLuongNgLieuDung
        ) THEN 1  -- Đủ nguyên liệu cho công thức -> Còn hàng
        ELSE 0    -- Thiếu ít nhất 1 nguyên liệu -> Hết hàng tạm thời[cite: 1]
    END
    WHERE ID IN (SELECT ID_MonAn FROM MonAnBiAnhHuong);
END;

----TRIGGER: TH2 Khi thêm/sửa/xóa công thức món ăn (NGUYENLIEU_MONAN)------------------------------------

GO
CREATE OR ALTER TRIGGER trg_CapNhatCongThuc
ON NGUYENLIEU_MONAN
AFTER INSERT, DELETE, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Lấy danh sách món ăn bị ảnh hưởng (từ inserted và deleted)
    DECLARE @MonAnTable TABLE (ID_MonAn INT);
    
    IF EXISTS(SELECT 1 FROM inserted)
        INSERT INTO @MonAnTable SELECT DISTINCT ID_MonAn FROM inserted;
    
    IF EXISTS(SELECT 1 FROM deleted)
        INSERT INTO @MonAnTable SELECT DISTINCT ID_MonAn FROM deleted;

    -- Cập nhật trạng thái cho các món bị ảnh hưởng
    UPDATE MONAN
    SET DangPhucVu = CASE 
        WHEN NOT EXISTS (
            SELECT 1
            FROM NGUYENLIEU_MONAN nlm
            WHERE nlm.ID_MonAn = MONAN.ID
              AND dbo.fn_LayTongSoLuongNguyenLieu(nlm.ID_NguyenLieu) < nlm.SoLuongNgLieuDung
        ) THEN 1
        ELSE 0
    END
    WHERE ID IN (SELECT ID_MonAn FROM @MonAnTable);
END;

----TRIGGER: TH3 Khi thêm món mới -> Kiểm tra có thể phục vụ không-----------------------

GO
CREATE OR ALTER TRIGGER trg_MonAn_InsertNew
ON MONAN
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE MONAN
    SET DangPhucVu = CASE 
        WHEN NOT EXISTS (
            SELECT 1
            FROM NGUYENLIEU_MONAN nlm
            WHERE nlm.ID_MonAn = inserted.ID
              AND dbo.fn_LayTongSoLuongNguyenLieu(nlm.ID_NguyenLieu) < nlm.SoLuongNgLieuDung
        ) THEN 1
        ELSE 0
    END
    FROM inserted
    WHERE MONAN.ID = inserted.ID;
END;

----TRIGGER: TH4 Khi nhập kho (CUNGCAP) -> cập nhật trạng thái món

GO
CREATE TRIGGER trg_NhapKho_CapNhatMonAn
ON CUNGCAP
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Lấy danh sách các nguyên liệu vừa được nhập thêm
    ;WITH NL_Nhap AS (
        SELECT DISTINCT ID_NguyenLieu 
        FROM inserted
    ),
    -- Tìm các món ăn dùng những nguyên liệu này
    MonAnCoThePhucVuLai AS (
        SELECT DISTINCT nlm.ID_MonAn
        FROM NGUYENLIEU_MONAN nlm
        JOIN NL_Nhap nl ON nlm.ID_NguyenLieu = nl.ID_NguyenLieu
    )
    -- Cập nhật lại trạng thái: nếu giờ đã đủ nguyên liệu -> bật lại Còn (1)
    UPDATE MONAN
    SET DangPhucVu = CASE 
        WHEN NOT EXISTS (
            SELECT 1
            FROM NGUYENLIEU_MONAN nlm2
            JOIN NGUYENLIEU nl2 ON nl2.ID = nlm2.ID_NguyenLieu
            WHERE nlm2.ID_MonAn = MONAN.ID
              AND dbo.fn_LayTongSoLuongNguyenLieu(nlm2.ID_NguyenLieu) < nlm2.SoLuongNgLieuDung
        ) THEN 1
        ELSE 0
    END
    WHERE MONAN.ID IN (SELECT ID_MonAn FROM MonAnCoThePhucVuLai)
      AND MONAN.DangPhucVu = 0;  -- Chỉ cập nhật những món đang Hết
END;

---- TRIGGER: TH5 Khi gọi món (đã phục vụ) -> tự động trừ nguyên liệu tồn kho ------------------

GO
CREATE OR ALTER TRIGGER trg_GoiMon_TruNguyenLieu
ON LANGOIMON_MON
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ID_KhoXuat INT = 2;
    -- Chỉ trừ khi món đã được phục vụ (tránh trừ 2 lần nếu có UPDATE)
    IF EXISTS (SELECT 1 FROM LANGOIMON l JOIN inserted i ON l.ID = i.ID_LanGoi WHERE l.TrangThai = N'Đã phục vụ')
    BEGIN
        -- 1. Trừ số lượng nguyên liệu trong bảng CHUA của Kho tương ứng
        UPDATE C
        SET C.SoLuong = C.SoLuong - T.SoLuongTru
        FROM CHUA C
        INNER JOIN (
            SELECT 
                nlm.ID_NguyenLieu,
                SUM(i.SoLuong * nlm.SoLuongNgLieuDung) AS SoLuongTru
            FROM inserted i
            JOIN NGUYENLIEU_MONAN nlm ON nlm.ID_MonAn = i.ID_MonAn
            JOIN LANGOIMON l ON l.ID = i.ID_LanGoi
            WHERE l.TrangThai = N'Đã phục vụ'
            GROUP BY nlm.ID_NguyenLieu
        ) T ON C.ID_NguyenLieu = T.ID_NguyenLieu
        WHERE C.ID_Kho = @ID_KhoXuat;;

        -- 2. Cập nhật lại trạng thái phục vụ của Món ăn (DangPhucVu)
        -- Sử dụng hàm fn_LayTongSoLuongNguyenLieu để kiểm tra tổng tồn kho
        UPDATE M
        SET M.DangPhucVu = CASE 
            WHEN EXISTS (
                SELECT 1
                FROM NGUYENLIEU_MONAN nlm
                WHERE nlm.ID_MonAn = M.ID
                  AND dbo.fn_LayTongSoLuongNguyenLieu(nlm.ID_NguyenLieu) < nlm.SoLuongNgLieuDung
            ) THEN 0 -- Hết hàng tạm thời
            ELSE 1    -- Còn hàng
        END
        FROM MONAN M
        WHERE M.ID IN (SELECT DISTINCT ID_MonAn FROM inserted);
    END
END;

---- TRIGGER: TH6 Tự động cập nhật tồn kho khi nhập hàng ------------------

GO
CREATE OR ALTER TRIGGER trg_CapNhatCHUA_KhiNhapHang
ON CUNGCAP
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Nếu nguyên liệu đã có trong kho đó -> Cộng dồn
    UPDATE C
    SET C.SoLuong = C.SoLuong + i.SoLuong
    FROM CHUA C
    JOIN inserted i ON C.ID_Kho = i.ID_Kho AND C.ID_NguyenLieu = i.ID_NguyenLieu;

    -- Nếu nguyên liệu chưa từng có trong kho đó -> Thêm mới dòng vào CHUA
    INSERT INTO CHUA (ID_Kho, ID_NguyenLieu, SoLuong)
    SELECT i.ID_Kho, i.ID_NguyenLieu, i.SoLuong
    FROM inserted i
    WHERE NOT EXISTS (
        SELECT 1 FROM CHUA 
        WHERE ID_Kho = i.ID_Kho AND ID_NguyenLieu = i.ID_NguyenLieu
    );
END;

---- PROC: Lập phiếu kiểm kê (Tự động lấy số lượng hệ thống) ------------------

GO
CREATE OR ALTER PROCEDURE sp_KhoiTaoKiemKe
    @ID_QuanLyKho INT,
    @ID_Kho INT,
    @ID_NguyenLieu INT
AS
BEGIN
    DECLARE @SL_HeThong DECIMAL(12,2);
    
    -- Lấy số lượng hiện tại trong bảng CHUA
    SELECT @SL_HeThong = ISNULL(SoLuong, 0)
    FROM CHUA
    WHERE ID_Kho = @ID_Kho AND ID_NguyenLieu = @ID_NguyenLieu;

    INSERT INTO KIEMKE (ID_QuanLyKho, ID_Kho, ID_NguyenLieu, SoLuongHeThong, SoLuongThucTe, DaXuLy)
    VALUES (@ID_QuanLyKho, @ID_Kho, @ID_NguyenLieu, @SL_HeThong, 0, 0);
    
    SELECT N'Đã khởi tạo phiếu kiểm kê. Số lượng hệ thống ghi nhận: ' + CAST(@SL_HeThong AS NVARCHAR(20)) AS Message;
END;

---- Trigger: Cân bằng kho sau khi kiểm kê ----

GO
CREATE OR ALTER TRIGGER trg_CanBangKho_SauKiemKe
ON KIEMKE
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Chỉ xử lý khi cột DaXuLy chuyển từ 0 sang 1
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON i.ID = d.ID 
               WHERE i.DaXuLy = 1 AND d.DaXuLy = 0)
    BEGIN
        UPDATE C
        SET C.SoLuong = i.SoLuongThucTe
        FROM CHUA C
        JOIN inserted i ON C.ID_Kho = i.ID_Kho AND C.ID_NguyenLieu = i.ID_NguyenLieu
        WHERE i.DaXuLy = 1;
        
        PRINT N'Đã cân bằng số lượng tồn kho theo thực tế kiểm kê.';
    END
END;

