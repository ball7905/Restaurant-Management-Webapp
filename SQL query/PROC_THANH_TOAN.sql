-- Stored Procedure for Payment Processing
-- Parameters:
--   ID_Don: Order ID
--   ID_LeTan: Receptionist ID
--   PhuongThuc: Payment method (Tiền mặt, Chuyển khoản, Thẻ, Ví điện tử)
--   SDT_Khach: Customer phone (optional)
--   DiemSuDung: Loyalty points used (optional)
--   GiamGiaTheoLuong: Voucher amount (optional)
--   PhanTramGiam: Discount percentage (optional)
DROP PROCEDURE IF EXISTS sp_ThanhToan;
GO
CREATE PROCEDURE sp_ThanhToan
    @ID_Don INT,
    @ID_LeTan INT,
    @PhuongThuc NVARCHAR(50),
    @SDT_Khach VARCHAR(20) = NULL,
    @DiemSuDung INT = 0,
    @GiamGiaTheoLuong DECIMAL(18,0) = 0,
    @PhanTramGiam FLOAT = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validate order exists
        IF NOT EXISTS (SELECT 1 FROM DONGOIMON WHERE ID = @ID_Don)
        BEGIN
            RAISERROR('Đơn hàng không tồn tại', 16, 1);
        END

        -- Calculate order total
        DECLARE @TongTienMon DECIMAL(18,0) = 0;
        DECLARE @Thue DECIMAL(18,0) = 0;
        DECLARE @TongGiamGia DECIMAL(18,0) = 0;
        DECLARE @ThanhTien DECIMAL(18,0) = 0;
        DECLARE @DiemThemVao INT = 0;
        DECLARE @ID_HoaDon INT;

        -- Get order total from DONGOIMON (TongTienTamTinh) instead of recalculating
        SELECT @TongTienMon = ISNULL(TongTienTamTinh, 0)
        FROM DONGOIMON
        WHERE ID = @ID_Don;

        -- Calculate tax (0 - no tax or use a configurable value)
        SET @Thue = 0;

        -- Calculate total discount
        SET @TongGiamGia = @GiamGiaTheoLuong + CAST((@TongTienMon * @PhanTramGiam / 100) AS DECIMAL(18,0)) + (@DiemSuDung * 1000);

        -- Calculate final amount (ThanhTien is computed: TongTienMon + Thue - TongGiamGia)
        SET @ThanhTien = @TongTienMon + @Thue - @TongGiamGia;
        IF @ThanhTien < 0 SET @ThanhTien = 0;

        -- Create or get invoice
        IF NOT EXISTS (SELECT 1 FROM HOADON WHERE ID_Don = @ID_Don)
        BEGIN
            INSERT INTO HOADON (ID_Don, ID_LeTan, SDT_Khach, TongTienMon, Thue, TongGiamGia)
            VALUES (@ID_Don, @ID_LeTan, @SDT_Khach, @TongTienMon, @Thue, @TongGiamGia);
            
            SET @ID_HoaDon = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            SELECT @ID_HoaDon = ID FROM HOADON WHERE ID_Don = @ID_Don;
            
            -- Update invoice with latest totals (Note: ThanhTien is computed, don't update it)
            UPDATE HOADON
            SET TongTienMon = @TongTienMon,
                Thue = @Thue,
                TongGiamGia = @TongGiamGia,
                SDT_Khach = COALESCE(@SDT_Khach, SDT_Khach),
                ID_LeTan = @ID_LeTan
            WHERE ID = @ID_HoaDon;
        END

        -- Record payment transaction
        IF NOT EXISTS (SELECT 1 FROM GIAODICHTHANHTOAN WHERE ID_HoaDon = @ID_HoaDon)
        BEGIN
            INSERT INTO GIAODICHTHANHTOAN (ID_HoaDon, ID_LeTan, SoTien, PhuongThuc, TrangThai)
            VALUES (@ID_HoaDon, @ID_LeTan, @ThanhTien, @PhuongThuc, N'Thành công');
        END
        ELSE
        BEGIN
            UPDATE GIAODICHTHANHTOAN
            SET PhuongThuc = @PhuongThuc,
                TrangThai = N'Thành công',
                SoTien = @ThanhTien,
                ID_LeTan = @ID_LeTan
            WHERE ID_HoaDon = @ID_HoaDon;
        END

        -- Update customer loyalty points ONLY if they are a member (Flag_ThanhVien = 1)
        IF @SDT_Khach IS NOT NULL AND @SDT_Khach <> ''
        BEGIN
            -- Check if customer is a member before updating
            IF EXISTS (SELECT 1 FROM KHACHHANG WHERE SDT = @SDT_Khach AND Flag_ThanhVien = 1)
            BEGIN
                -- Calculate points to add (1 point per 10,000 VND)
                SET @DiemThemVao = CAST(@ThanhTien / 10000 AS INT);

                -- Update loyalty points for members only
                UPDATE KHACHHANG
                SET DiemTichLuy = ISNULL(DiemTichLuy, 0) + @DiemThemVao - @DiemSuDung
                WHERE SDT = @SDT_Khach AND Flag_ThanhVien = 1;
            END
        END

        -- Update order status
        UPDATE DONGOIMON
        SET TrangThai = N'Đã thanh toán'
        WHERE ID = @ID_Don;

        COMMIT TRANSACTION;

        -- Return success message
        SELECT N'Thanh toán thành công! Điểm tích lũy: ' + CAST(@DiemThemVao AS NVARCHAR(10)) AS Message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        -- Return error message
        SELECT ERROR_MESSAGE() AS Message;
        THROW;
    END CATCH
END;
