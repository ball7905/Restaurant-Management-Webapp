CREATE OR ALTER TRIGGER trg_CapNhatTongTien_RealTime
ON LANGOIMON_MON
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Tìm danh sách các ID_Don bị ảnh hưởng bởi thao tác này
    DECLARE @AffectedOrders TABLE (ID_Don INT);

    INSERT INTO @AffectedOrders (ID_Don)
    SELECT DISTINCT L.ID_Don
    FROM (
        SELECT ID_LanGoi FROM inserted
        UNION
        SELECT ID_LanGoi FROM deleted
    ) AS ChangedRows
    JOIN LANGOIMON L ON ChangedRows.ID_LanGoi = L.ID
    WHERE L.ID_Don IS NOT NULL;

    -- 2. Tính toán lại tổng tiền và Update vào bảng DONGOIMON
    UPDATE D
    SET D.TongTienTamTinh = ISNULL(Calculated.NewTotal, 0)
    FROM DONGOIMON D
    JOIN (
        SELECT 
            L.ID_Don,
            SUM(ISNULL(LM.SoLuong * LM.DonGiaThoiDiem, 0)) AS NewTotal
        FROM LANGOIMON L
        JOIN LANGOIMON_MON LM ON L.ID = LM.ID_LanGoi
        WHERE L.ID_Don IN (SELECT ID_Don FROM @AffectedOrders)
          -- Chỉ tính các món chưa hủy (nếu bạn có trạng thái hủy món)
        GROUP BY L.ID_Don
    ) AS Calculated ON D.ID = Calculated.ID_Don;
    
    -- (Tùy chọn) Nếu đơn đó đã có trong bảng THANHTOAN (đã chốt), update luôn bảng đó cho đồng bộ
    UPDATE T
    SET T.TongTienMon = D.TongTienTamTinh
    FROM THANHTOAN T
    JOIN DONGOIMON D ON T.ID_Don = D.ID
    WHERE D.ID IN (SELECT ID_Don FROM @AffectedOrders);
END;