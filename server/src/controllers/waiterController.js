import sql from "mssql";
import { pool, poolConnect } from "../db.js";

/* ---------------- GET DATA ---------------- */

// Lấy danh sách các đơn hàng đang phục vụ (Active Orders) CỦA RIÊNG WAITER ĐÓ
export async function getActiveOrders(req, res) {
  try {
    await poolConnect;

    // Lấy ID nhân viên từ token (đã được middleware verifyToken giải mã)
    const serverId = req.user.id;

    // 1. Lấy danh sách Đơn (DONGOIMON) đang 'Đang phục vụ' VÀ thuộc về nhân viên này
    const ordersResult = await pool
      .request()
      .input("ServerID", sql.Int, serverId) // Truyền tham số ID Phục vụ
      .query(`
        SELECT 
          D.ID as id,
          D.ID_Ban as table_id,
          D.ThoiGianTao as start_time,
          COALESCE(K.HoTen, N'Khách Vãng Lai') as customer_name
        FROM DONGOIMON D
        LEFT JOIN BAN B ON D.ID_Ban = B.ID_Ban
        -- Tìm thông tin đặt bàn gần nhất khớp với bàn này để lấy tên khách
        OUTER APPLY (
          SELECT TOP 1 DB.SDT_Khach 
          FROM DATBAN DB 
          WHERE DB.ID_Ban = D.ID_Ban AND DB.TrangThai = N'Đã nhận bàn'
          ORDER BY DB.ThoiGianDat DESC
        ) BookingInfo
        LEFT JOIN KHACHHANG K ON BookingInfo.SDT_Khach = K.SDT
        WHERE D.TrangThai = N'Đang phục vụ' 
          AND D.ID_PhucVu = @ServerID -- Chỉ lấy đơn của chính nhân viên này
        ORDER BY D.ThoiGianTao ASC
      `);

    const orders = ordersResult.recordset;

    // 2. Lấy danh sách các Lần gọi món (Rounds) cho các đơn này
    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id).join(",");

      // Query này không cần lọc theo nhân viên nữa vì ID_Don đã được lọc ở bước 1 rồi
      const roundsResult = await pool.request().query(`
            SELECT 
                L.ID as id,
                L.ID_Don as order_id,
                L.ThoiDiemGoi as time,
                L.TrangThai as status,
                L.GhiChu as note
            FROM LANGOIMON L
            WHERE L.ID_Don IN (${orderIds})
            ORDER BY L.ThoiDiemGoi ASC
        `);

      const rounds = roundsResult.recordset;

      // Ghép rounds vào orders
      orders.forEach((order) => {
        order.rounds = rounds.filter((r) => r.order_id === order.id);
      });
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Lấy Menu đang kinh doanh
export async function getMenu(req, res) {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT ID as id, Ten as name, DonGia as price, PhanLoai as category 
      FROM MONAN 
      WHERE DangKinhDoanh = 1 AND DangPhucVu = 1
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Lấy chi tiết món ăn trong 1 lần gọi
export async function getRoundDetail(req, res) {
  const { roundId } = req.params;
  try {
    await poolConnect;
    const result = await pool.request().input("ID_LanGoi", sql.Int, roundId)
      .query(`
                SELECT 
                    M.Ten as item_name,
                    LM.SoLuong as quantity,
                    LM.DonGiaThoiDiem as price,
                    (LM.SoLuong * LM.DonGiaThoiDiem) as total
                FROM LANGOIMON_MON LM
                JOIN MONAN M ON LM.ID_MonAn = M.ID
                WHERE LM.ID_LanGoi = @ID_LanGoi
            `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ---------------- ACTIONS ---------------- */

/* --- API 1: TẠO LƯỢT GỌI MỚI (Khởi tạo vỏ giỏ hàng) --- */
export async function startRound(req, res) {
  const { order_id, note } = req.body; // order_id là ID đơn (bàn đang ăn)

  try {
    await poolConnect;
    const request = pool.request();
    request.input("ID_Don", sql.Int, order_id);
    request.input("GhiChu", sql.NVarChar(500), note || "");

    // Gọi SP tạo lần gọi (Nhớ đã sửa SP này để chỉ trả về ID như bài trước)
    const result = await request.execute("sp_TaoLanGoiMon");

    // Lấy ID vừa tạo
    const roundId = result.recordset[0].ID_LanGoiMoi;

    res.json({
      success: true,
      message: "Đã khởi tạo lượt gọi mới",
      roundId: roundId,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/* --- API 2: THÊM MÓN VÀO LƯỢT GỌI ĐÃ CÓ --- */
export async function addItemsToRound(req, res) {
  const { round_id, items } = req.body; // round_id: ID lượt vừa tạo, items: [{item_id, quantity}]

  if (!items || items.length === 0)
    return res.status(400).json({ error: "Chưa chọn món nào để thêm" });

  try {
    await poolConnect;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Loop qua từng món để thêm vào lượt gọi (round_id)
      for (const item of items) {
        const reqItem = new sql.Request(transaction);
        reqItem.input("ID_LanGoi", sql.Int, round_id);
        reqItem.input("ID_MonAn", sql.Int, item.item_id);
        reqItem.input("SoLuong", sql.Int, item.quantity);
        await reqItem.execute("sp_ThemMonVaoLanGoi");
      }

      await transaction.commit();
      res.json({ success: true, message: "Đã thêm món vào danh sách chờ nấu" });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// Cập nhật trạng thái phục vụ (Sẵn sàng -> Đã phục vụ)
export async function updateRoundStatus(req, res) {
  const { roundId, status } = req.body; // status: 'Đã phục vụ'

  // Lấy ID nhân viên từ token để ghi nhận ai là người bấm "Đã phục vụ"
  const serverId = req.user.id;

  try {
    await poolConnect;
    const request = pool.request();
    request.input("ID_LanGoi", sql.Int, roundId);
    request.input("TrangThaiMoi", sql.NVarChar(50), status);
    request.input("ID_NhanVien", sql.Int, serverId);

    await request.execute("sp_CapNhatTrangThaiLanGoi");

    res.json({ success: true, message: "Cập nhật trạng thái thành công" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}
