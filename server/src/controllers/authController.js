import sql from "mssql";
import { pool, poolConnect } from "../db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { config } from "../config.js";

/* ---------------- LOGIN ---------------- */
export async function login(req, res) {
  // DB mới dùng Username để đăng nhập
  const { username, password } = req.body;

  try {
    await poolConnect;

    // 1. Tìm user trong bảng NHANVIEN
    const result = await pool.request().input("username", sql.VarChar, username)
      .query(`
        SELECT ID, HoTen, Username, Password, ChucDanh, NgayNghiViec
        FROM NHANVIEN 
        WHERE Username = @username
      `);

    const user = result.recordset[0];

    if (!user)
      return res.status(400).json({ error: "Sai tên đăng nhập hoặc mật khẩu" });

    if (user.NgayNghiViec !== null) {
      return res
        .status(403)
        .json({ error: "Bạn đã nghỉ việc, không thể đăng nhập hệ thống." });
    }

    // So sánh: Nếu bcrypt so khớp OK HOẶC mật khẩu trong DB trùng khớp hoàn toàn
    const isMatchHash = await bcrypt
      .compare(password, user.Password)
      .catch(() => false);
    const isMatchPlain = password === user.Password;

    if (!isMatchHash && !isMatchPlain) {
      return res.status(400).json({ error: "Sai tên đăng nhập hoặc mật khẩu" });
    }

    // Map 'ChucDanh' từ DB sang 'role' trong Token để Middleware dễ xử lý
    const token = jwt.sign(
      {
        id: user.ID,
        name: user.HoTen,
        role: user.ChucDanh, // Ví dụ: "Quản lý", "Lễ tân"
      },
      config.jwtSecret,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user.ID,
        name: user.HoTen,
        role: user.ChucDanh,
        username: user.Username,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ---------------- SEED USER (Dùng Stored Proc) ---------------- */
export async function seedUser(req, res) {
  const body = req.body;
  const users = Array.isArray(body) ? body : [body];

  try {
    await poolConnect;
    const results = [];

    for (let u of users) {
      const hash = await bcrypt.hash(u.password, 10);
      const request = pool.request();

      // Mapping tham số vào SP sp_ThemNhanVien
      // Lưu ý: Cần gửi đủ các trường NOT NULL của DB (CCCD, NgaySinh...)
      // Ở đây tôi giả định req.body gửi lên đủ.

      request.input("CCCD", sql.VarChar(12), u.cccd);
      request.input("HoTen", sql.NVarChar(200), u.name);
      request.input("Username", sql.VarChar(50), u.username); // Dùng username
      request.input("Password", sql.VarChar(255), hash);
      request.input("NgaySinh", sql.Date, u.dob || "1990-01-01");
      request.input("NgayVaoLam", sql.Date, new Date());
      request.input("Luong", sql.Decimal(12, 2), u.salary || 5000000);
      request.input("DiaChi", sql.NVarChar(300), u.address || "HCM");
      request.input("ChucDanh", sql.NVarChar(50), u.role); // "Quản lý", "Lễ tân"...
      request.input("LoaiHinhLamViec", sql.NVarChar(50), "Fulltime");
      request.input("SDT_Chinh", sql.VarChar(20), u.phone);

      // Tham số optional cho từng role
      if (u.role === "Lễ tân")
        request.input("NgoaiNgu", sql.NVarChar, "Tiếng Anh");
      if (u.role === "Phục vụ")
        request.input("CaLamViec", sql.NVarChar, "Sáng");

      // Gọi Procedure
      const result = await request.execute("sp_ThemNhanVien");

      results.push({ msg: `Created user ${u.username}` });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
