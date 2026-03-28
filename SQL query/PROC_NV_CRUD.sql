-- ========================================================
-- PROCEDURE CRUD CHO NHAN VIEN 
-- ========================================================
USE DB_RESTAURANT;

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
            RETURN;
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
            RETURN;
        END
    END
END;

GO
-- PROCEDURE: thêm nhân viên
CREATE PROCEDURE sp_ThemNhanVien
    -- THÔNG TIN CƠ BẢN (Bắt buộc)
    @CCCD               VARCHAR(12),
    @HoTen              NVARCHAR(200),

    @Username           VARCHAR(50),
    @Password           VARCHAR(255),

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
        IF (DATEDIFF(DAY, @NgaySinh, GETUTCDATE()) / 365.25 < 18)
            THROW 50001, N'Lỗi: Nhân viên phải từ 18 tuổi trở lên.', 1;

        -- 2. Validate SĐT (Định dạng)
        IF LEN(@SDT_Chinh) < 10 OR @SDT_Chinh LIKE '%[^0-9]%'
            THROW 50002, N'Lỗi: Số điện thoại không hợp lệ.', 1;

        IF EXISTS (SELECT 1 FROM NHANVIEN WHERE Username = @Username)
        THROW 50013, N'Lỗi: Tên đăng nhập (Username) này đã được sử dụng.', 1;
        
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
        INSERT INTO NHANVIEN (CCCD, HoTen, Username, Password, NgaySinh, NgayVaoLam, Luong, DiaChi, ChucDanh, LoaiHinhLamViec, ID_GiamSat)
        VALUES (@CCCD, @HoTen,@Username,@Password, @NgaySinh, @NgayVaoLam, @Luong, @DiaChi, @ChucDanh, @LoaiHinhLamViec, @ID_GiamSat);

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
        -- Lấy thông báo để in trong backend
        SELECT N'Thêm nhân viên thành công! Mã nhân viên mới: ' + CAST(@NewID AS NVARCHAR(20)) AS Message;
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
    @Password           VARCHAR(255) = NULL,
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
                INSERT INTO QUANLY (ID, NgayNhanChuc) VALUES (@ID, ISNULL(@NgayNhanChuc, GETUTCDATE()));
            ELSE IF @ChucDanhMoi = N'Bếp trưởng' 
                INSERT INTO BEPTRUONG (ID, ChuyenMon, NgayNhanChuc) VALUES (@ID, @ChuyenMon, ISNULL(@NgayNhanChuc, GETUTCDATE()));
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
        -- Thêm để lấy về backend
        SELECT N'Cập nhật thông tin nhân viên ' + CAST(@ID AS NVARCHAR(20)) + N' thành công.' AS Message;

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
        SET NgayNghiViec = GETUTCDATE(), 
            ID_GiamSat = NULL 
        WHERE ID = @ID;

        -- B. Update bảng Con
        IF EXISTS (SELECT 1 FROM QUANLY WHERE ID = @ID)
        BEGIN
            UPDATE QUANLY 
            SET NgayKetThuc = GETUTCDATE() 
            WHERE ID = @ID AND NgayKetThuc IS NULL; 
        END

        IF EXISTS (SELECT 1 FROM BEPTRUONG WHERE ID = @ID)
        BEGIN
            UPDATE BEPTRUONG 
            SET NgayKetThuc = GETUTCDATE() 
            WHERE ID = @ID AND NgayKetThuc IS NULL;
        END

        COMMIT TRANSACTION;
        PRINT N'Đã thực hiện xóa mềm (cho nghỉ việc) nhân viên thành công.';
        -- Thêm để backend lấy
        SELECT N'Đã cho nhân viên ' + CAST(@ID AS NVARCHAR(20)) + N' nghỉ việc thành công.' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR (@ErrorMessage, 16, 1);
    END CATCH
END;

-- ========================================================
-- Xử lý SĐT phụ
-- ========================================================
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
        -- Cho backend
        SELECT N'Đã thêm số ' + @SDT_Phu + N' vào danh sách liên lạc của nhân viên ' + CAST(@ID_NhanVien AS NVARCHAR(20)) + N'.' AS Message;
        
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
        -- Cho backend
        SELECT N'Đã xóa số ' + @SDT_Phu + N' khỏi danh sách.' AS Message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR (@ErrorMessage, 16, 1);
    END CATCH
END;