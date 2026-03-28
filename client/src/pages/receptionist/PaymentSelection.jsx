import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout.jsx";

export default function PaymentSelection() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  // --- STATE CHO MODAL THANH TOÁN NHANH ---
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form đơn giản cho thanh toán nhanh
  const [quickPayForm, setQuickPayForm] = useState({
    paymentMethod: "Tiền mặt",
    phone: "", // Chỉ cần nhập SĐT để tích điểm nhanh
  });

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + sessionStorage.getItem("token"),
  });

  // 1. LOAD DANH SÁCH ĐƠN
  const loadOrders = () => {
    fetch("http://localhost:3000/api/reception/serving-orders", {
      headers: getHeaders(),
    })
      .then((res) => res.json())
      .then(setOrders)
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadOrders();
    // Auto refresh để cập nhật đơn mới
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // 2. MỞ MODAL THANH TOÁN NHANH
  const handleOpenQuickPay = (e, order) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click vào card (để không chuyển trang)
    setSelectedOrder(order);
    setQuickPayForm({ paymentMethod: "Tiền mặt", phone: "" }); // Reset form
    setShowModal(true);
  };

  // 3. XỬ LÝ THANH TOÁN (GỌI API)
  const handleQuickPaySubmit = async () => {
    if (
      !confirm(
        `Xác nhận thu ${fmtMoney(selectedOrder.totalAmount)} cho Đơn #${
          selectedOrder.orderId
        }?`
      )
    )
      return;

    const payload = {
      order_id: selectedOrder.orderId,
      receptionist_id: JSON.parse(sessionStorage.getItem("user"))?.id,
      payment_method: quickPayForm.paymentMethod,
      phone: quickPayForm.phone || null, // Gửi SĐT để tích điểm nếu có
      use_points: 0, // Thanh toán nhanh mặc định không dùng điểm
      voucher_amount: 0, // Thanh toán nhanh mặc định không dùng voucher
      discount_percent: 0,
    };

    try {
      const res = await fetch("http://localhost:3000/api/reception/pay", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        alert("✅ Thanh toán thành công!");
        setShowModal(false);
        loadOrders(); // Reload lại danh sách để đơn vừa trả biến mất
      } else {
        alert("❌ Lỗi: " + data.error);
      }
    } catch (err) {
      alert("Lỗi kết nối: " + err.message);
    }
  };

  const fmtMoney = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);

  return (
    <DashboardLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ color: "#5a381e", margin: 0 }}>
          Chọn Đơn Hàng Thanh Toán
        </h2>
        <button onClick={loadOrders} style={styles.refreshBtn}>
          🔄 Làm mới
        </button>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", color: "#666", marginTop: "50px" }}>
          Không có đơn hàng nào đang phục vụ.
        </div>
      ) : (
        <div style={styles.grid}>
          {orders.map((order) => (
            <div
              key={order.orderId}
              style={styles.card}
              // Click vào card vẫn vào trang chi tiết (để xem món, tách bill...)
              onClick={() => navigate(`/reception/payment/${order.orderId}`)}
            >
              <div style={styles.header}>
                <span style={styles.badge}>Đơn #{order.orderId}</span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#555",
                  }}
                >
                  Bàn {order.tableId}
                </span>
              </div>

              <div style={{ margin: "15px 0" }}>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  {order.customerName}
                </div>
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}
                >
                  Giờ vào:{" "}
                  {new Date(order.checkInTime).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <div style={styles.footer}>
                <div
                  style={{
                    color: "#b3541e",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                >
                  {fmtMoney(order.totalAmount)}
                </div>

                {/* NÚT THANH TOÁN NHANH */}
                <button
                  style={styles.quickPayBtn}
                  onClick={(e) => handleOpenQuickPay(e, order)}
                >
                  Thanh Toán
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL THANH TOÁN NHANH --- */}
      {showModal && selectedOrder && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>
                Thanh Toán Nhanh - Đơn #{selectedOrder.orderId}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: "#f9f9f9",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <div style={{ color: "#666" }}>Tổng tiền cần thu</div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#b3541e",
                }}
              >
                {fmtMoney(selectedOrder.totalAmount)}
              </div>
              <div
                style={{ fontSize: "14px", color: "#333", marginTop: "5px" }}
              >
                Khách: <strong>{selectedOrder.customerName}</strong> (Bàn{" "}
                {selectedOrder.tableId})
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={styles.label}>Phương thức thanh toán:</label>
              <select
                style={styles.input}
                value={quickPayForm.paymentMethod}
                onChange={(e) =>
                  setQuickPayForm({
                    ...quickPayForm,
                    paymentMethod: e.target.value,
                  })
                }
              >
                <option value="Tiền mặt">💵 Tiền mặt</option>
                <option value="Chuyển khoản">🏦 Chuyển khoản</option>
                <option value="Thẻ">💳 Thẻ</option>
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={styles.label}>
                SĐT Thành viên (Tích điểm - Optional):
              </label>
              <input
                style={styles.input}
                placeholder="Nhập số điện thoại khách..."
                value={quickPayForm.phone}
                onChange={(e) =>
                  setQuickPayForm({ ...quickPayForm, phone: e.target.value })
                }
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleQuickPaySubmit} style={styles.submitBtn}>
                Xác Nhận Thanh Toán
              </button>
              <button
                onClick={() =>
                  navigate(`/reception/payment/${selectedOrder.orderId}`)
                }
                style={styles.detailBtn}
              >
                Xem Chi Tiết Hóa Đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    border: "1px solid #eee",
    cursor: "pointer",
    transition: "transform 0.2s",
    display: "flex",
    flexDirection: "column",
    ":hover": { transform: "translateY(-3px)" },
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    background: "#e0e0e0",
    color: "#333",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: "15px",
    borderTop: "1px dashed #eee",
  },

  quickPayBtn: {
    padding: "8px 16px",
    background: "#4caf50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
    boxShadow: "0 2px 5px rgba(76, 175, 80, 0.3)",
  },
  refreshBtn: {
    padding: "8px 15px",
    background: "white",
    border: "1px solid #ddd",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#5a381e",
  },

  // Modal Styles
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
    padding: "25px",
    borderRadius: "12px",
    width: "450px",
    maxWidth: "90%",
    boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
  },
  label: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "5px",
    fontSize: "14px",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },

  submitBtn: {
    flex: 1,
    padding: "12px",
    background: "#4caf50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "16px",
  },
  detailBtn: {
    flex: 1,
    padding: "12px",
    background: "transparent",
    border: "1px solid #ccc",
    color: "#555",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
