import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";

export default function WaiterDashBoard() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // --- STATE QUẢN LÝ ---
  const [showMenuModal, setShowMenuModal] = useState(false); // Modal Menu (để chọn món)
  const [showDetailModal, setShowDetailModal] = useState(false); // Modal Chi tiết (để xem/xử lý)

  const [activeRoundId, setActiveRoundId] = useState(null); // ID lượt đang được thêm món
  const [selectedRound, setSelectedRound] = useState(null); // Lượt đang xem chi tiết

  const [cart, setCart] = useState({}); // Giỏ hàng
  const [currentTableId, setCurrentTableId] = useState(null); // Để hiển thị tiêu đề

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + sessionStorage.getItem("token"),
  });

  async function loadActiveOrders() {
    try {
      const res = await fetch("http://localhost:3000/api/waiter/orders", {
        headers: getHeaders(),
      });
      if (res.ok) setActiveOrders(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  async function loadMenu(refresh = false) {
    try {
      const url = `http://localhost:3000/api/waiter/menu${refresh ? "?refresh=true" : ""}`;
      const res = await fetch(url, {
        headers: getHeaders(),
      });
      if (res.ok) setMenuItems(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadActiveOrders();
    loadMenu(true);
    const interval = setInterval(loadActiveOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateNewRound = async (order) => {
    if (!confirm(`Tạo lượt gọi mới cho Bàn ${order.table_id}?`)) return;

    try {
      const res = await fetch("http://localhost:3000/api/waiter/round/start", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ order_id: order.id }),
      });
      const data = await res.json();

      if (res.ok) {
        loadActiveOrders();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Lỗi kết nối: " + err.message);
    }
  };

  const handleViewRoundDetail = async (round, tableId) => {
    try {
      // Gọi API lấy chi tiết các món trong lượt này
      const res = await fetch(
        `http://localhost:3000/api/waiter/round/${round.id}`,
        {
          headers: getHeaders(),
        }
      );
      const items = await res.json();

      if (res.ok) {
        // Lưu thông tin để hiển thị popup chi tiết
        setSelectedRound({ ...round, items, tableId });
        setShowDetailModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper: Chuyển từ màn hình Chi tiết -> Màn hình Menu (Để gọi thêm)
  const handleSwitchToMenu = () => {
    if (!selectedRound) return;
    setShowDetailModal(false); // Tắt chi tiết
    openMenuForRound(selectedRound.id, selectedRound.tableId); // Mở menu
  };

  // Helper: Mở Modal Menu cho một lượt cụ thể
  const openMenuForRound = (roundId, tableId) => {
    setActiveRoundId(roundId);
    setCurrentTableId(tableId);
    setCart({}); // Reset giỏ hàng
    setShowMenuModal(true);
  };

  // --- 4. CÁC HÀM XỬ LÝ (Quantity, Submit, Update Status) ---

  const handleQuantity = (itemID, delta) => {
    setCart((prev) => {
      const newQty = (prev[itemID] || 0) + delta;
      if (newQty <= 0) {
        const { [itemID]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemID]: newQty };
    });
  };

  const handleSubmitItems = async () => {
    if (Object.keys(cart).length === 0) return alert("Chưa chọn món nào!");

    // API add-items dùng logic cộng dồn (Nếu món đã có thì tăng số lượng)
    const payload = {
      round_id: activeRoundId,
      items: Object.entries(cart).map(([id, qty]) => ({
        item_id: parseInt(id),
        quantity: qty,
      })),
    };

    try {
      const res = await fetch(
        "http://localhost:3000/api/waiter/round/add-items",
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        alert("Đã thêm món thành công!");
        setShowMenuModal(false);
        setActiveRoundId(null);
        setCart({});
        loadActiveOrders();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleServeRound = async (roundId) => {
    if (!confirm("Xác nhận đã mang món ra cho khách?")) return;
    try {
      const res = await fetch("http://localhost:3000/api/waiter/round/status", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ roundId, status: "Đã phục vụ" }),
      });
      if (res.ok) {
        setShowDetailModal(false);
        loadActiveOrders();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch {
      alert("Lỗi kết nối");
    }
  };

  const fmtMoney = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const placeholderImage = "/shrimp_590711.png";

  return (
    <DashboardLayout>
      <h2 style={{ color: "#5a381e", marginBottom: "20px" }}>Phục Vụ Bàn</h2>

      <div style={styles.gridContainer}>
        {activeOrders.length === 0 && <p>Không có bàn nào đang phục vụ.</p>}

        {activeOrders.map((order) => (
          <div key={order.id} style={styles.orderCard}>
            {/* Header */}
            <div style={styles.cardHeader}>
              <div style={styles.tableBadge}>Bàn {order.table_id}</div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                {new Date(order.start_time).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Ho_Chi_Minh",
                })}
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                {order.customer_name}
              </div>
              <div style={{ fontSize: "12px", color: "#888" }}>
                ID Đơn: #{order.id}
              </div>
            </div>

            {/* List Rounds */}
            <div style={styles.roundsContainer}>
              {order.rounds &&
                order.rounds.map((round, idx) => (
                  <button
                    key={round.id}
                    style={{
                      ...styles.roundChip,
                      background: getStatusColor(round.status),
                      border:
                        round.status === "Sẵn sàng phục vụ"
                          ? "2px solid red"
                          : "none",
                      animation:
                        round.status === "Sẵn sàng phục vụ"
                          ? "pulse 1.5s infinite"
                          : "none",
                    }}
                    // CLICK VÀO ĐỂ XEM CHI TIẾT
                    onClick={() => handleViewRoundDetail(round, order.table_id)}
                  >
                    Lần {idx + 1} {round.status === "Sẵn sàng phục vụ" && "🔔"}
                  </button>
                ))}
            </div>

            <button
              style={styles.addBtn}
              onClick={() => handleCreateNewRound(order)}
            >
              + Tạo Lần Gọi Mới
            </button>
          </div>
        ))}
      </div>

      {/* --- MODAL 1: MENU CHỌN MÓN (Dùng chung cho Tạo mới & Gọi thêm) --- */}
      {showMenuModal && (
        <div style={styles.overlay} onClick={() => setShowMenuModal(false)}>
          <div style={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>
                Thêm món - Bàn {currentTableId} (Lượt #{activeRoundId})
              </h3>
              <button
                onClick={() => setShowMenuModal(false)}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <div style={styles.menuGrid}>
              {menuItems.map((item) => {
                const qty = cart[item.id] || 0;
                const imageUrl =
                  item.imageURL || item.ImageURL || item.HinhAnh || item.url || placeholderImage;
                return (
                  <div key={item.id} style={styles.menuItem}>
                    <img
                      src={imageUrl}
                      alt={item.name}
                      style={styles.menuThumb}
                      onError={(e) => {
                        if (e.target.src !== placeholderImage) {
                          e.target.onerror = null;
                          e.target.src = placeholderImage;
                        }
                      }}
                    />
                    <div style={{ fontWeight: "bold", marginTop: "8px" }}>
                      {item.name}
                    </div>
                    <div style={{ color: "#b3541e", fontSize: "13px" }}>
                      {fmtMoney(item.price)}
                    </div>
                    <div style={styles.counterControl}>
                      <button
                        style={styles.counterBtn}
                        onClick={() => handleQuantity(item.id, -1)}
                        disabled={qty === 0}
                      >
                        -
                      </button>
                      <span style={{ width: "20px", textAlign: "center" }}>
                        {qty}
                      </span>
                      <button
                        style={styles.counterBtn}
                        onClick={() => handleQuantity(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={styles.modalFooter}>
              <div style={{ fontWeight: "bold" }}>
                Đã chọn: {Object.keys(cart).length} món
              </div>
              <button style={styles.submitBtn} onClick={handleSubmitItems}>
                Gửi Bếp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CHI TIẾT LẦN GỌI (Xem ds món cũ & Action) --- */}
      {showDetailModal && selectedRound && (
        <div style={styles.overlay} onClick={() => setShowDetailModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Chi tiết Lần gọi #{selectedRound.id}</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            {/* Thông tin trạng thái */}
            <div
              style={{
                marginBottom: "15px",
                padding: "10px",
                background: "#f5f5f5",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            >
              Trạng thái:{" "}
              <strong style={{ color: getStatusColor(selectedRound.status) }}>
                {selectedRound.status}
              </strong>
            </div>

            {/* Danh sách món đã gọi trước đó */}
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                marginBottom: "20px",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #ddd",
                      textAlign: "left",
                      fontSize: "13px",
                    }}
                  >
                    <th style={{ padding: "5px 0" }}>Món đã gọi</th>
                    <th style={{ padding: "5px 0", textAlign: "center" }}>
                      SL
                    </th>
                    <th style={{ padding: "5px 0", textAlign: "right" }}>
                      Tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRound.items?.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        style={{
                          textAlign: "center",
                          padding: "10px",
                          fontStyle: "italic",
                        }}
                      >
                        Chưa có món nào
                      </td>
                    </tr>
                  ) : (
                    selectedRound.items?.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px dashed #eee" }}>
                        <td style={{ padding: "8px 0" }}>{item.item_name}</td>
                        <td style={{ padding: "8px 0", textAlign: "center" }}>
                          x{item.quantity}
                        </td>
                        <td style={{ padding: "8px 0", textAlign: "right" }}>
                          {fmtMoney(item.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ACTION BUTTONS: Tùy theo trạng thái mà hiện nút khác nhau */}
            <div style={{ display: "flex", gap: "10px" }}>
              {/* CASE 1: Đang xử lý -> Cho phép GỌI THÊM */}
              {selectedRound.status === "Đang xử lý" && (
                <button
                  style={{
                    ...styles.submitBtn,
                    background: "#ff9800",
                    width: "100%",
                  }}
                  onClick={handleSwitchToMenu}
                >
                  Gọi thêm món vào lượt này
                </button>
              )}

              {/* CASE 2: Sẵn sàng -> Cho phép PHỤC VỤ */}
              {selectedRound.status === "Sẵn sàng phục vụ" && (
                <button
                  style={{
                    ...styles.submitBtn,
                    background: "#4caf50",
                    width: "100%",
                  }}
                  onClick={() => handleServeRound(selectedRound.id)}
                >
                  Xác nhận Đã Phục Vụ
                </button>
              )}

              {/* CASE 3: Đã phục vụ -> Chỉ xem, không làm gì (hoặc in bill) */}
              {selectedRound.status === "Đã phục vụ" && (
                <button
                  style={{
                    ...styles.submitBtn,
                    background: "#ccc",
                    width: "100%",
                    cursor: "default",
                  }}
                  disabled
                >
                  Đã hoàn tất
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// --- UTILS ---
function getStatusColor(status) {
  if (status === "Đang xử lý") return "#ff9800";
  if (status === "Sẵn sàng phục vụ") return "#2196f3";
  if (status === "Đã phục vụ") return "#4caf50";
  return "#9e9e9e";
}

const styles = {
  // ... (Giữ nguyên styles như các phiên bản trước)
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  orderCard: {
    background: "white",
    borderRadius: "12px",
    padding: "15px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #eee",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    borderBottom: "1px solid #f0f0f0",
    paddingBottom: "8px",
  },
  tableBadge: {
    background: "#5a381e",
    color: "white",
    padding: "4px 8px",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "14px",
  },
  roundsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "15px",
  },
  roundChip: {
    border: "none",
    color: "white",
    padding: "6px 12px",
    borderRadius: "15px",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "opacity 0.2s",
  },
  addBtn: {
    width: "100%",
    padding: "12px",
    border: "1px dashed #b3541e",
    background: "#fff8f0",
    color: "#b3541e",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "auto",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    width: "450px",
    maxWidth: "90%",
    boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
  },
  modalLarge: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "1000px",
    height: "85vh",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
  },
  menuGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    overflowY: "auto",
    flex: 1,
    paddingRight: "5px",
  },
  menuItem: {
    border: "1px solid #eee",
    borderRadius: "8px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "220px",
    maxHeight: "320px",
    overflow: "hidden",
  },
  counterControl: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f5f5f5",
    borderRadius: "4px",
    padding: "2px",
  },
  counterBtn: {
    border: "none",
    background: "white",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#5a381e",
    fontWeight: "bold",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  modalFooter: {
    marginTop: "15px",
    borderTop: "1px solid #eee",
    paddingTop: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  submitBtn: {
    padding: "10px 20px",
    background: "#b3541e",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  menuThumb: {
    width: "100%",
    height: "100px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "10px",
  },
};
