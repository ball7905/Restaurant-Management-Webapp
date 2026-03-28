import sql from "mssql";
import { pool, poolConnect } from "../db.js";

/* -------- KITCHEN QUEUE (REAL DATABASE DATA) -------- */
export async function getKitchenQueue(req, res) {
  try {
    await poolConnect;

    // Query: Lấy các Lần gọi đang 'Đang xử lý'
    // Sử dụng kỹ thuật XML PATH để gộp nhiều món ăn trong 1 lần gọi thành 1 chuỗi text
    const query = `
      SELECT 
        L.ID as id,
        CONCAT(N'Bàn ', B.ID_Ban) as tableName,
        L.TrangThai as status,
        FORMAT(L.ThoiDiemGoi, 'HH:mm') as time,
        
        -- Gộp tên món và số lượng: "Phở (1), Trà (2)"
        STUFF((
            SELECT N', ' + M.Ten + N' (x' + CAST(LM.SoLuong AS NVARCHAR(10)) + N')'
            FROM LANGOIMON_MON LM
            JOIN MONAN M ON LM.ID_MonAn = M.ID
            WHERE LM.ID_LanGoi = L.ID
            FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, ''
        ) as dishName,

        -- Tổng số lượng món trong lần gọi này
        (SELECT SUM(SoLuong) FROM LANGOIMON_MON WHERE ID_LanGoi = L.ID) as quantity

      FROM LANGOIMON L
      JOIN DONGOIMON D ON L.ID_Don = D.ID
      JOIN BAN B ON D.ID_Ban = B.ID_Ban
      WHERE L.TrangThai = N'Đang xử lý'
      ORDER BY L.ThoiDiemGoi ASC
    `;

    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* -------- UPDATE ORDER STATUS -------- */
export async function updateOrderStatus(req, res) {
  const { id } = req.params; // ID Lần gọi (LANGOIMON)
  const { status } = req.body; // Trạng thái gửi từ frontend ("Đang nấu", "Sẵn sàng"...)
  const chefId = req.user ? req.user.id : null; // ID Bếp trưởng từ Token

  try {
    await poolConnect;
    const request = pool.request();

    let dbStatus = "";

    // Trường hợp 1: Bấm "Xong" -> Chuyển thành 'Sẵn sàng phục vụ'
    if (status === "Sẵn sàng" || status === "Sẵn sàng phục vụ") {
      dbStatus = "Sẵn sàng phục vụ";

      request.input("ID_LanGoi", sql.Int, id);
      request.input("TrangThaiMoi", sql.NVarChar(50), dbStatus);
      request.input("ID_NhanVien", sql.Int, chefId); // Bếp trưởng xác nhận

      await request.execute("sp_CapNhatTrangThaiLanGoi");

      return res.json({
        success: true,
        message: `Đã báo món xong (Round #${id})`,
      });
    }

    // Trường hợp 2: Bấm "Nấu" (Đang nấu)
    // DB hiện tại chỉ có 'Đang xử lý' -> 'Sẵn sàng phục vụ'.
    // Trạng thái 'Đang nấu' chỉ là UI state để bếp biết mình đang làm, không cần update DB (hoặc DB chưa hỗ trợ).
    else if (status === "Đang nấu") {
      // Chỉ trả về success để Frontend cập nhật UI đổi màu, không gọi DB
      return res.json({
        success: true,
        message: `Đang nấu đơn #${id}...`,
      });
    } else {
      return res.status(400).json({ error: "Trạng thái không hợp lệ" });
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/* -------- MENU REQUESTS (YÊU CẦU CẬP NHẬT THỰC ĐƠN) -------- */

// Gửi yêu cầu cập nhật
export async function submitMenuRequest(req, res) {
  const {
    chefId,
    type,
    dishId, // type: 'Thêm', 'Sửa', 'Xóa'
    name,
    price,
    category,
    description,
    reason,
  } = req.body;

  try {
    await poolConnect;
    const request = pool.request();

    request.input("ID_BepTruong", sql.Int, chefId);
    request.input("LoaiYeuCau", sql.NVarChar(10), type);
    request.input("ID_MonAn", sql.Int, dishId || null);
    request.input("TenMon", sql.NVarChar(100), name || null);
    request.input("DonGia", sql.Decimal(12, 0), price || null);
    request.input("MoTa", sql.NVarChar(500), description || null);
    request.input("PhanLoai", sql.NVarChar(10), category || null);
    request.input("LyDo", sql.NVarChar(200), reason);

    const result = await request.execute("sp_GuiYeuCauCapNhat");

    res.json({
      success: true,
      message: result.recordset[0]?.Message,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// Lấy lịch sử yêu cầu của bếp trưởng
export async function getChefRequests(req, res) {
  const { chefId } = req.params;
  try {
    await poolConnect;
    const result = await pool.request().input("ID", sql.Int, chefId).query(`
                SELECT R.*, M.Ten as TenMonHienTai
                FROM CAPNHAT_MONAN R
                LEFT JOIN MONAN M ON R.ID_MonAn = M.ID
                WHERE R.ID_BepTruong = @ID
                ORDER BY R.ThoiGianTao DESC
            `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
