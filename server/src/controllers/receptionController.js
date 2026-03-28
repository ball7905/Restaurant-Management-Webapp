import sql from "mssql";
import { pool, poolConnect } from "../db.js";

/* -------- GET TABLES WITH STATUS BY TIME (Lọc bàn theo giờ) -------- */
export async function getTables(req, res) {
  try {
    await poolConnect;

    // Nhận tham số date (YYYY-MM-DD) và hour (0-23) từ query string
    // Nếu không có thì lấy thời gian hiện tại
    const now = new Date();
    const date = req.query.date || now.toISOString().split("T")[0];
    const hour =
      req.query.hour !== undefined ? parseInt(req.query.hour) : now.getHours();

    const request = pool.request();
    request.input("Date", sql.Date, date);
    request.input("Hour", sql.Int, hour);

    // Query: Lấy tất cả bàn, Join với DATBAN để xem trong giờ đó có đơn nào không
    // Chỉ lấy đơn chưa hủy
    const query = `
      SELECT 
        B.ID_Ban as id, 
        B.SucChua as capacity, 
        CASE 
            WHEN D.TrangThai IS NOT NULL THEN D.TrangThai 
            ELSE N'Trống' 
        END as status,
        D.ID_DatBan as bookingId,
        K.HoTen as guestName
      FROM BAN B
      LEFT JOIN DATBAN D ON B.ID_Ban = D.ID_Ban 
        AND D.TrangThai <> N'Đã hủy'
        AND CAST(D.ThoiGianDat AS DATE) = @Date
        AND DATEPART(HOUR, D.ThoiGianDat) = @Hour
      LEFT JOIN KHACHHANG K ON D.SDT_Khach = K.SDT
      ORDER BY B.ID_Ban ASC
    `;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* -------- GET ALL BOOKINGS (Giữ nguyên hoặc lọc theo ngày nếu muốn) -------- */
export async function getBookings(req, res) {
  try {
    await poolConnect;
    // Lấy danh sách đặt bàn (Sắp xếp đơn mới nhất lên đầu)
    const result = await pool.request().query(`
      SELECT TOP 50
        D.ID_DatBan as id,
        D.ThoiGianDat as bookingTime,
        D.SoLuongKhach as guestCount,
        D.TrangThai as status,
        D.GhiChu as note,
        B.ID_Ban as tableId,
        K.HoTen as guestName,
        K.SDT as phone
      FROM DATBAN D
      LEFT JOIN BAN B ON D.ID_Ban = B.ID_Ban
      LEFT JOIN KHACHHANG K ON D.SDT_Khach = K.SDT
      ORDER BY D.ThoiGianDat ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* -------- CREATE A BOOKING -------- */
export async function createBooking(req, res) {
  const { guest_name, phone, table_id, guest_count, booking_time, note } =
    req.body;
  const receptionistId = req.user ? req.user.id : null;

  try {
    await poolConnect;
    const request = pool.request();

    request.input("SDT_Khach", sql.VarChar(20), phone);
    request.input("TenKhach", sql.NVarChar(50), guest_name);
    request.input("SoLuongKhach", sql.Int, guest_count);
    request.input("ThoiGianDat", sql.DateTime2, booking_time); // Thời gian này do Frontend ghép từ Date+Hour
    request.input("ID_Ban", sql.Int, table_id || null);
    request.input("ID_LeTan", sql.Int, receptionistId);
    request.input("GhiChu", sql.NVarChar(500), note || "");

    await request.execute("sp_TaoDatBan");

    res.json({ success: true, message: "Đặt bàn thành công!" });
  } catch (err) {
    console.error("Lỗi đặt bàn:", err.message);
    res.status(400).json({ success: false, error: err.message });
  }
}

/* -------- CHECK-IN -------- */
export async function checkInBooking(req, res) {
  const { id } = req.params;
  const { server_id } = req.body;
  const receptionistId = req.user ? req.user.id : null;

  try {
    await poolConnect;
    const request = pool.request();
    request.input("ID_DatBan", sql.Int, id);
    request.input("ID_LeTan", sql.Int, receptionistId);
    request.input("ID_PhucVu", sql.Int, server_id);

    await request.execute("sp_NhanBan");
    res.json({
      success: true,
      message: "Nhận bàn thành công. Đơn gọi món đã được tạo.",
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/* -------- CANCEL BOOKING -------- */
export async function cancelBooking(req, res) {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    await poolConnect;
    const request = pool.request();
    request.input("ID_DatBan", sql.Int, id);
    request.input(
      "GhiChuHuy",
      sql.NVarChar(200),
      reason || "Khách yêu cầu hủy"
    );

    await request.execute("sp_HuyDatBan");
    res.json({ success: true, message: "Đã hủy đặt bàn." });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function updateTableStatus(req, res) {
  res.json({ success: true });
}

export async function updateBooking(req, res) {
  // Logic update booking nếu cần (hiện tại chưa dùng tới trong UI mới)
  res.json({ success: true });
}

export async function deleteBooking(req, res) {
  // Logic delete cứng (ít dùng, thường dùng cancel)
  const { id } = req.params;
  try {
    await poolConnect;
    await pool
      .request()
      .input("ID", sql.Int, id)
      .query("DELETE FROM DATBAN WHERE ID_DatBan = @ID");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 1. API: Lấy thông tin khách hàng để check điểm
export async function getCustomerInfo(req, res) {
  const { phone } = req.query;
  try {
    await poolConnect;
    const result = await pool
      .request()
      .input("SDT", sql.VarChar(20), phone)
      .query(
        "SELECT HoTen, DiemTichLuy, Flag_ThanhVien FROM KHACHHANG WHERE SDT = @SDT"
      );

    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ error: "Khách hàng không tồn tại" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 2. API: Thanh toán (Gọi sp_ThanhToan)
export async function processPayment(req, res) {
  const {
    order_id,
    receptionist_id,
    payment_method, // 'Tiền mặt', 'Chuyển khoản', 'Thẻ'
    phone, // Optional
    use_points, // Optional (int)
    voucher_amount, // Optional (money)
    discount_percent, // Optional (float)
  } = req.body;

  try {
    await poolConnect;
    const request = pool.request();

    request.input("ID_Don", sql.Int, order_id);
    request.input("ID_LeTan", sql.Int, receptionist_id); //
    request.input("PhuongThuc", sql.NVarChar(50), payment_method);

    // Các tham số Optional (Nếu không gửi thì để null hoặc 0)
    request.input("SDT_Khach", sql.VarChar(20), phone || null);
    request.input("DiemSuDung", sql.Int, use_points || 0);
    request.input("GiamGiaTheoLuong", sql.Decimal(12, 0), voucher_amount || 0);
    request.input("PhanTramGiam", sql.Float, discount_percent || 0);

    const result = await request.execute("sp_ThanhToan");

    res.json({
      success: true,
      message: result.recordset[0]?.Message,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getServingOrders(req, res) {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT 
        D.ID as orderId,
        D.ID_Ban as tableId,
        D.ThoiGianTao as checkInTime,
        COALESCE(K.HoTen, N'Khách bàn ' + CAST(D.ID_Ban AS NVARCHAR(10))) as customerName,
        
        -- KHÔNG CẦN SUBQUERY TÍNH TOÁN NỮA
        -- Lấy trực tiếp từ cột vừa tạo, cực nhanh
        ISNULL(D.TongTienTamTinh, 0) as totalAmount

      FROM DONGOIMON D
      LEFT JOIN DATBAN DB ON D.ID_Ban = DB.ID_Ban AND DB.TrangThai = N'Đã nhận bàn'
      LEFT JOIN KHACHHANG K ON DB.SDT_Khach = K.SDT
      WHERE D.TrangThai = N'Đang phục vụ'
      ORDER BY D.ThoiGianTao DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 2. API SỬA ĐỔI: Lấy chi tiết hóa đơn theo ORDER ID (Không dùng Table ID nữa)
export async function getBillDetails(req, res) {
  const { orderId } = req.params;
  try {
    await poolConnect;

    // SỬA LẠI: Dùng LEFT JOIN để luôn lấy được thông tin đơn hàng dù chưa có món
    const result = await pool.request().input("ID_Don", sql.Int, orderId)
      .query(`
        SELECT 
            -- Thông tin Header (Đơn hàng)
            D.ID as OrderID,
            D.ID_Ban, 
            D.ThoiGianTao,
            
            -- Thông tin Detail (Món ăn) - Có thể NULL nếu chưa gọi món
            M.Ten as item_name,
            LM.SoLuong as quantity,
            LM.DonGiaThoiDiem as price,
            (LM.SoLuong * LM.DonGiaThoiDiem) as total
        FROM DONGOIMON D
        -- Dùng LEFT JOIN để không bị mất đơn hàng nếu chưa có món
        LEFT JOIN LANGOIMON L ON D.ID = L.ID_Don 
        LEFT JOIN LANGOIMON_MON LM ON L.ID = LM.ID_LanGoi 
        LEFT JOIN MONAN M ON LM.ID_MonAn = M.ID
        WHERE D.ID = @ID_Don
      `);

    // Nếu không tìm thấy đơn hàng nào (ID sai)
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Đơn hàng không tồn tại." });
    }

    // Lấy thông tin Header từ dòng đầu tiên
    const firstRow = result.recordset[0];

    // Map danh sách món (Lọc bỏ những dòng NULL do Left Join sinh ra)
    const items = result.recordset
      .filter((row) => row.item_name !== null) // Chỉ lấy dòng có món ăn
      .map((row) => ({
        item_name: row.item_name,
        quantity: row.quantity,
        price: row.price,
        total: row.total,
      }));

    // Tính tổng tiền
    const totalAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);

    res.json({
      order_id: firstRow.OrderID,
      table_id: firstRow.ID_Ban,
      order_time: firstRow.ThoiGianTao,
      items: items,
      total_amount: totalAmount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
