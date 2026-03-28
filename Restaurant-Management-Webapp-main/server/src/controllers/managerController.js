import sql from "mssql";
import bcrypt from "bcrypt";
import { pool, poolConnect } from "../db.js";

/* ---------------- EMPLOYEES (NHANVIEN) ---------------- */

export async function addEmployee(req, res) {
  const {
    cccd,
    name,
    username,
    password,
    dob,
    startDate,
    salary,
    address,
    role,
    workType,
    phone,
    supervisorId,
    positionDate,
    expertise,
    shift,
    materialGroup,
    language,
  } = req.body;

  try {
    await poolConnect;
    const hash = await bcrypt.hash(password, 10);
    const request = pool.request();

    request.input("CCCD", sql.VarChar(12), cccd);
    request.input("HoTen", sql.NVarChar(200), name);
    request.input("Username", sql.VarChar(50), username);
    request.input("Password", sql.VarChar(255), hash);
    request.input("NgaySinh", sql.Date, dob);
    request.input("NgayVaoLam", sql.Date, startDate || new Date());
    request.input("Luong", sql.Decimal(12, 2), salary);
    request.input("DiaChi", sql.NVarChar(300), address);
    request.input("ChucDanh", sql.NVarChar(50), role);
    request.input("LoaiHinhLamViec", sql.NVarChar(50), workType);
    request.input("SDT_Chinh", sql.VarChar(20), phone);
    request.input("ID_GiamSat", sql.Int, supervisorId || null);

    request.input("NgayNhanChuc", sql.Date, positionDate || null);
    request.input("ChuyenMon", sql.NVarChar(50), expertise || null);
    request.input("CaLamViec", sql.NVarChar(20), shift || null);
    request.input("NhomNguyenLieu", sql.NVarChar(20), materialGroup || null);
    request.input("NgoaiNgu", sql.NVarChar(100), language || null);

    const result = await request.execute("sp_ThemNhanVien");
    const dbMessage = result.recordset[0]?.Message;

    res.json({ success: true, message: dbMessage, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getEmployees(req, res) {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT 
        N.ID as id, N.CCCD as cccd, N.HoTen as name, N.Username as username, 
        N.ChucDanh as role, N.LoaiHinhLamViec as workType, S.SDT as phone
      FROM NHANVIEN N
      OUTER APPLY (SELECT TOP 1 SDT FROM SDT_NHANVIEN WHERE ID_NhanVien = N.ID) S
      WHERE N.NgayNghiViec IS NULL
      ORDER BY N.ID ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateEmployee(req, res) {
  const { id } = req.params;
  const {
    name,
    username,
    password,
    dob,
    salary,
    address,
    phone,
    role,
    workType,
    supervisorId,
    positionDate,
    expertise,
    shift,
    materialGroup,
    language,
  } = req.body;

  try {
    await poolConnect;
    const request = pool.request();

    request.input("ID", sql.Int, id);
    if (name) request.input("HoTen", sql.NVarChar(200), name);
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      request.input("Password", sql.VarChar(255), hash);
    }
    if (dob) request.input("NgaySinh", sql.Date, dob);
    if (salary) request.input("Luong", sql.Decimal(12, 2), salary);
    if (address) request.input("DiaChi", sql.NVarChar(300), address);
    if (phone) request.input("SDT", sql.VarChar(20), phone);
    if (workType) request.input("LoaiHinhLamViec", sql.NVarChar(50), workType);
    if (supervisorId) request.input("ID_GiamSat", sql.Int, supervisorId);

    if (role) request.input("ChucDanhMoi", sql.NVarChar(50), role);
    if (positionDate) request.input("NgayNhanChuc", sql.Date, positionDate);
    if (expertise) request.input("ChuyenMon", sql.NVarChar(50), expertise);
    if (shift) request.input("CaLamViec", sql.NVarChar(20), shift);
    if (materialGroup)
      request.input("NhomNguyenLieu", sql.NVarChar(20), materialGroup);
    if (language) request.input("NgoaiNgu", sql.NVarChar(100), language);

    const result = await request.execute("sp_CapNhatNhanVien");

    const dbMessage = result.recordset[0]?.Message;
    res.json({ success: true, message: dbMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteEmployee(req, res) {
  const { id } = req.params;
  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("ID", sql.Int, id)
      .execute("sp_XoaNhanVien");

    const dbMessage = result.recordset[0]?.Message;
    res.json({ success: true, message: dbMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ---------------- PHONE NUMBERS ---------------- */

export async function getEmployeePhones(req, res) {
  const { id } = req.params;
  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("ID", sql.Int, id)
      .query("SELECT SDT FROM SDT_NHANVIEN WHERE ID_NhanVien = @ID");
    res.json(result.recordset.map((r) => r.SDT));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function addEmployeePhone(req, res) {
  const { employeeId, phone } = req.body;
  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("ID_NhanVien", sql.Int, employeeId)
      .input("SDT_Phu", sql.VarChar(20), phone)
      .execute("sp_ThemSDT_Phu");

    const dbMessage = result.recordset[0]?.Message;
    res.json({ success: true, message: dbMessage });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteEmployeePhone(req, res) {
  const { employeeId, phone } = req.body;
  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("ID_NhanVien", sql.Int, employeeId)
      .input("SDT_Phu", sql.VarChar(20), phone)
      .execute("sp_XoaSDT_Phu");

    const dbMessage = result.recordset[0]?.Message;
    res.json({ success: true, message: dbMessage });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/* ---------------- MENU (MONAN) ---------------- */

export async function addMenuItem(req, res) {
  const { name, price, category, description } = req.body;
  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("Ten", sql.NVarChar(100), name)
      .input("DonGia", sql.Decimal(12, 0), price)
      .input("PhanLoai", sql.NVarChar(10), category)
      .input("MoTa", sql.NVarChar(500), description || "")
      .input("DangPhucVu", sql.Bit, 1)
      .input("DangKinhDoanh", sql.Bit, 1)
      .execute("sp_ThemMonAn");

    const dbMessage = result.recordset[0]?.Message;
    res.json({
      success: true,
      message: dbMessage,
      id: result.recordset[0]?.ID,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getMenuItems(req, res) {
  try {
    await poolConnect;
    const result = await pool
      .request()
      .query("SELECT * FROM MONAN WHERE DangKinhDoanh = 1 ORDER BY ID ASC");
    res.json(result.recordset);
  } catch {
    res.status(500).json({ error: "Lỗi tải danh sách món ăn" });
  }
}

export async function updateMenuItem(req, res) {
  const { id } = req.params;
  const { name, price, category, description, isServing } = req.body;
  try {
    await poolConnect;
    const request = pool.request();
    request.input("ID", sql.Int, parseInt(id));
    if (name) request.input("Ten", sql.NVarChar(100), name);
    if (price) request.input("DonGia", sql.Decimal(12, 0), price);
    if (category) request.input("PhanLoai", sql.NVarChar(10), category);
    if (description !== undefined)
      request.input("MoTa", sql.NVarChar(500), description);
    if (isServing !== undefined)
      request.input("DangPhucVu", sql.Bit, isServing);

    const result = await request.execute("sp_CapNhatMonAn");
    const dbMessage = result.recordset[0]?.Message;
    res.json({ success: true, message: dbMessage });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function deleteMenuItem(req, res) {
  const { id } = req.params;
  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("ID", sql.Int, id)
      .execute("sp_XoaMonAn");

    const dbMessage = result.recordset[0]?.Message;
    res.json({ success: true, message: dbMessage });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/* ---------------- DASHBOARD STATS ---------------- */

export async function getStats(req, res) {
  try {
    await poolConnect;
    const result = await pool.request().execute("sp_GetDailyStats");

    const stats = result.recordset[0];

    res.json({
      revenueToday: stats.revenueToday,
      ordersToday: stats.ordersToday,
      customersToday: stats.customersToday,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ---------------- MENU REQUESTS (DUYỆT YÊU CẦU) [MỚI] ---------------- */

// Lấy danh sách yêu cầu đang chờ duyệt
export async function getPendingMenuRequests(req, res) {
  try {
    await poolConnect;
    const result = await pool.request().query(`
            SELECT 
                R.*, 
                NV.HoTen as TenBepTruong,
                M.Ten as TenMonGoc
            FROM CAPNHAT_MONAN R
            JOIN BEPTRUONG B ON R.ID_BepTruong = B.ID
            JOIN NHANVIEN NV ON B.ID = NV.ID
            LEFT JOIN MONAN M ON R.ID_MonAn = M.ID
            WHERE R.TrangThai = N'Chờ duyệt'
            ORDER BY R.ThoiGianTao ASC
        `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Duyệt hoặc Từ chối
export async function processMenuRequest(req, res) {
  const { requestId, managerId, status } = req.body; // status: 'Đã duyệt' / 'Từ chối'

  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("ID_YeuCau", sql.Int, requestId)
      .input("ID_QuanLy", sql.Int, managerId)
      .input("TrangThai", sql.NVarChar(20), status)
      .execute("sp_DuyetYeuCauCapNhat");

    const dbMessage = result.recordset[0]?.Message;
    res.json({ success: true, message: dbMessage });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// 1. API Xem Báo Cáo Doanh Thu & Chi Tiết (Gọi sp_BaoCaoDoanhThu_ChiTietDon)
// GET /api/manager/reports/revenue?type=Tháng&start=...&end=...&minRevenue=...
export async function getRevenueReport(req, res) {
  try {
    await poolConnect;
    const { type } = req.query; // type: 'Tháng', 'Quý', 'Năm'

    const request = pool.request();

    let query = `
      SELECT 
        ID, 
        LoaiBaoCao, 
        Ky, 
        Nam, 
        TongDoanhThu, 
        TongChiPhi, 
        LoiNhuan,
        ThoiGianLap
      FROM BAOCAODOANHTHU
      WHERE 1=1
    `;

    // Nếu có lọc theo loại (Tháng/Quý/Năm)
    if (type) {
      request.input("LoaiBaoCao", sql.NVarChar(10), type);
      query += " AND LoaiBaoCao = @LoaiBaoCao";
    }

    // Sắp xếp: Năm mới nhất, Kỳ mới nhất lên đầu
    query += " ORDER BY Nam DESC, Ky DESC";

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 2. API Tạo & Lưu Báo Cáo Định Kỳ (Gọi sp_TaoVaLuuBaoCao)
// POST /api/manager/reports/generate
export async function generatePeriodicReport(req, res) {
  const { type, period, year } = req.body; // type: 'Tháng'/'Quý'/'Năm', period: 1-12, year: 2023

  try {
    await poolConnect;
    const request = pool.request();

    request.input("LoaiBaoCao", sql.NVarChar(10), type);
    request.input("Ky", sql.Int, period);
    request.input("Nam", sql.Int, year);

    const result = await request.execute("sp_TaoVaLuuBaoCao");

    // SP trả về 2 result sets: [0] là Message, [1] là Dữ liệu vừa tạo
    const message = result.recordsets[0]?.[0]?.Message;
    const data = result.recordsets[1]?.[0];

    res.json({ success: true, message, data });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}
