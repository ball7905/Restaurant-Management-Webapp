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
            WHERE m.TrangThai = 0
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
CREATE TRIGGER trg_CapNhat_SoLuongNguyenLieuTonKho
ON NGUYENLIEU
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Chỉ xử lý khi cột SoLuong bị thay đổi
    IF NOT UPDATE(SoLuong) RETURN;

    -- Tìm tất cả các món ăn sử dụng các nguyên liệu vừa bị update
    ;WITH MonAnBiAnhHuong AS (
        SELECT DISTINCT nm.ID_MonAn
        FROM inserted i
        JOIN NGUYENLIEU_MONAN nm ON nm.ID_NguyenLieu = i.ID
    )
    -- Cập nhật lại trạng thái phục vụ cho các món bị ảnh hưởng
    UPDATE MONAN
    SET TrangThai = CASE 
        WHEN NOT EXISTS (
            SELECT 1
            FROM NGUYENLIEU_MONAN nlm
            JOIN NGUYENLIEU nl ON nl.ID = nlm.ID_NguyenLieu
            WHERE nlm.ID_MonAn = MONAN.ID
              AND nl.SoLuong < nlm.SoLuongNgLieuDung  -- Thiếu nguyên liệu
        ) THEN 1  -- Đủ hết -> Còn
        ELSE 0    -- Thiếu ít nhất 1 nguyên liệu -> Hết
    END
    WHERE ID IN (SELECT ID_MonAn FROM MonAnBiAnhHuong);
END;

----TRIGGER: TH2 Khi thêm/sửa/xóa công thức món ăn (NGUYENLIEU_MONAN)------------------------------------
GO
CREATE TRIGGER trg_CapNhatCongThuc
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
    SET TrangThai = CASE 
        WHEN NOT EXISTS (
            SELECT 1
            FROM NGUYENLIEU_MONAN nlm
            JOIN NGUYENLIEU nl ON nl.ID = nlm.ID_NguyenLieu
            WHERE nlm.ID_MonAn = MONAN.ID
              AND nl.SoLuong < nlm.SoLuongNgLieuDung
        ) THEN 1
        ELSE 0
    END
    WHERE ID IN (SELECT ID_MonAn FROM @MonAnTable);
END;

----TRIGGER: TH3 Khi thêm món mới -> Kiểm tra có thể phục vụ không-----------------------
GO
CREATE TRIGGER trg_MonAn_InsertNew
ON MONAN
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE MONAN
    SET TrangThai = CASE 
        WHEN NOT EXISTS (
            SELECT 1
            FROM NGUYENLIEU_MONAN nlm
            JOIN NGUYENLIEU nl ON nl.ID = nlm.ID_NguyenLieu
            WHERE nlm.ID_MonAn = inserted.ID
              AND nl.SoLuong < nlm.SoLuongNgLieuDung
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
    SET TrangThai = CASE 
        WHEN NOT EXISTS (
            SELECT 1
            FROM NGUYENLIEU_MONAN nlm2
            JOIN NGUYENLIEU nl2 ON nl2.ID = nlm2.ID_NguyenLieu
            WHERE nlm2.ID_MonAn = MONAN.ID
              AND nl2.SoLuong < nlm2.SoLuongNgLieuDung
        ) THEN 1
        ELSE 0
    END
    WHERE MONAN.ID IN (SELECT ID_MonAn FROM MonAnCoThePhucVuLai)
      AND MONAN.TrangThai = 0;  -- Chỉ cập nhật những món đang Hết
END;

---- TRIGGER: TH5 Khi gọi món (đã phục vụ) -> tự động trừ nguyên liệu tồn kho ------------------
GO
CREATE OR ALTER TRIGGER trg_GoiMon_TruNguyenLieu
ON LANGOIMON_MON
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Chỉ trừ khi món đã được phục vụ (tránh trừ 2 lần nếu có UPDATE)
    IF EXISTS (SELECT 1 FROM LANGOIMON l JOIN inserted i ON l.ID = i.ID_LanGoi WHERE l.TrangThai = N'Đã phục vụ')
    BEGIN
        ;WITH TruNL AS (
            SELECT 
                nlm.ID_NguyenLieu,
                SUM(i.SoLuong * nlm.SoLuongNgLieuDung) AS SoLuongTru
            FROM inserted i
            JOIN NGUYENLIEU_MONAN nlm ON nlm.ID_MonAn = i.ID_MonAn
            JOIN LANGOIMON l ON l.ID = i.ID_LanGoi
            WHERE l.TrangThai = N'Đã phục vụ'
            GROUP BY nlm.ID_NguyenLieu
        )
        UPDATE NGUYENLIEU
        SET SoLuong = SoLuong - t.SoLuongTru
        FROM NGUYENLIEU nl
        JOIN TruNL t ON nl.ID = t.ID_NguyenLieu;

        -- Tự động cập nhật lại trạng thái món nếu giờ thiếu nguyên liệu
        EXEC trg_CapNhat_SoLuongNguyenLieuTonKho;
    END
END;


