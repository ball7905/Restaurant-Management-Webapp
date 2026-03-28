import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout.jsx";

export default function PaymentPage() {
  const { orderId } = useParams(); // LẤY ID ĐƠN TỪ URL
  const navigate = useNavigate();

  // State dữ liệu hóa đơn
  const [orderInfo, setOrderInfo] = useState(null); // { order_id, items, total_amount ... }

  // State form thanh toán
  const [paymentForm, setPaymentForm] = useState({
    phone: "",
    customerName: "",
    availablePoints: 0,
    usePoints: 0,
    voucherAmount: 0,
    discountPercent: 0,
    paymentMethod: "Tiền mặt",
  });

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + sessionStorage.getItem("token"),
  });

  // 1. LOAD CHI TIẾT HÓA ĐƠN
  useEffect(() => {
    // Gọi API endpoint mới
    fetch(`http://localhost:3000/api/reception/bill/${orderId}`, {
      headers: getHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Không tìm thấy hóa đơn");
        return res.json();
      })
      .then(setOrderInfo)
      .catch((err) => {
        alert(err.message);
        navigate("/reception/payment"); // Quay lại trang danh sách nếu lỗi
      });
  }, [orderId]);

  // 2. CHECK THÀNH VIÊN
  const checkMember = async () => {
    if (!paymentForm.phone) return alert("Vui lòng nhập SĐT");
    try {
      const res = await fetch(
        `http://localhost:3000/api/reception/customer?phone=${paymentForm.phone}`,
        {
          headers: getHeaders(),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setPaymentForm((prev) => ({
          ...prev,
          customerName: data.HoTen,
          availablePoints: data.DiemTichLuy,
        }));
      } else {
        alert("Không tìm thấy khách hàng");
        setPaymentForm((prev) => ({
          ...prev,
          customerName: "",
          availablePoints: 0,
        }));
      }
    } catch {
      alert("Lỗi kết nối");
    }
  };

  // 3. TÍNH TOÁN TIỀN
  const calculateFinal = () => {
    if (!orderInfo) return 0;
    const total = orderInfo.total_amount;
    const discountPoint = (parseInt(paymentForm.usePoints) || 0) * 1000;
    const discountVoucher = parseInt(paymentForm.voucherAmount) || 0;
    const discountPercent =
      (total * (parseFloat(paymentForm.discountPercent) || 0)) / 100;

    let final = total - discountPoint - discountVoucher - discountPercent;
    return final < 0 ? 0 : final;
  };

  // 4. SUBMIT THANH TOÁN
  const handlePaymentSubmit = async () => {
    if (!confirm(`Xác nhận thanh toán Đơn hàng #${orderId}?`)) return;

    const payload = {
      order_id: orderInfo.order_id, // Lấy từ state đã load
      receptionist_id: JSON.parse(sessionStorage.getItem("user"))?.id,
      payment_method: paymentForm.paymentMethod,
      phone: paymentForm.phone || null,
      use_points: parseInt(paymentForm.usePoints) || 0,
      voucher_amount: parseInt(paymentForm.voucherAmount) || 0,
      discount_percent: parseFloat(paymentForm.discountPercent) || 0,
    };

    try {
      const res = await fetch("http://localhost:3000/api/reception/pay", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Thanh toán thành công!");
        navigate("/reception"); // Quay về màn hình chính
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const fmtMoney = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  if (!orderInfo)
    return (
      <DashboardLayout>
        <div>Đang tải hóa đơn...</div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div style={{ display: "flex", gap: "20px", height: "85vh" }}>
        <div style={styles.billSection}>
          <div
            style={{
              textAlign: "center",
              borderBottom: "2px dashed #ccc",
              paddingBottom: "15px",
              marginBottom: "15px",
            }}
          >
            <h2 style={{ margin: "0 0 5px 0" }}>HÓA ĐƠN THANH TOÁN</h2>
            {/* Hiển thị thông tin lấy từ API */}
            <div style={{ fontSize: "18px", fontWeight: "bold" }}>
              Mã đơn: #{orderInfo.order_id}
            </div>
            <div style={{ color: "#333" }}>
              Vị trí: Bàn {orderInfo.table_id}
            </div>
            <div style={{ color: "#666", fontSize: "13px" }}>
              Giờ vào: {new Date(orderInfo.order_time).toLocaleString("vi-VN")}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}
                >
                  <th>Món</th>
                  <th style={{ textAlign: "center" }}>SL</th>
                  <th style={{ textAlign: "right" }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {orderInfo.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px dashed #eee" }}>
                    <td style={{ padding: "10px 0" }}>{item.item_name}</td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>
                      {fmtMoney(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              borderTop: "2px solid #333",
              paddingTop: "15px",
              marginTop: "auto",
            }}
          >
            <div style={styles.rowSummary}>
              <span>Tổng tiền món:</span>
              <strong style={{ fontSize: "18px" }}>
                {fmtMoney(orderInfo.total_amount)}
              </strong>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: ĐIỀU KHIỂN THANH TOÁN */}
        <div style={styles.controlSection}>
          <h3 style={{ marginTop: 0, color: "#5a381e" }}>
            Thông tin thanh toán
          </h3>

          {/* 1. KHÁCH HÀNG */}
          <div style={styles.group}>
            <label style={styles.label}>Khách hàng thành viên</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                style={styles.input}
                placeholder="Nhập SĐT..."
                value={paymentForm.phone}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, phone: e.target.value })
                }
              />
              <button onClick={checkMember} style={styles.btnSearch}>
                🔍
              </button>
            </div>
            {paymentForm.customerName && (
              <div style={styles.memberInfo}>
                ✅ <strong>{paymentForm.customerName}</strong> - Điểm:{" "}
                {paymentForm.availablePoints}
              </div>
            )}
          </div>

          {/* 2. GIẢM GIÁ */}
          <div style={styles.group}>
            <label style={styles.label}>Sử dụng điểm (1đ = 1.000đ)</label>
            <input
              type="number"
              style={styles.input}
              value={paymentForm.usePoints}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, usePoints: e.target.value })
              }
              disabled={!paymentForm.customerName}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
            }}
          >
            <div style={styles.group}>
              <label style={styles.label}>Voucher (VNĐ)</label>
              <input
                type="number"
                style={styles.input}
                value={paymentForm.voucherAmount}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    voucherAmount: e.target.value,
                  })
                }
              />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Giảm %</label>
              <input
                type="number"
                style={styles.input}
                value={paymentForm.discountPercent}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    discountPercent: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* 3. TỔNG KẾT & PHƯƠNG THỨC */}
          <div style={styles.finalBox}>
            <div style={styles.rowSummary}>
              <span>Tạm tính:</span>
              <span>{fmtMoney(orderInfo.total_amount)}</span>
            </div>
            <div style={{ ...styles.rowSummary, color: "red" }}>
              <span>Giảm giá:</span>
              <span>
                - {fmtMoney(orderInfo.total_amount - calculateFinal())}
              </span>
            </div>
            <hr style={{ margin: "15px 0", borderColor: "#ddd" }} />
            <div
              style={{
                ...styles.rowSummary,
                fontSize: "24px",
                color: "#b3541e",
                fontWeight: "bold",
              }}
            >
              <span>PHẢI THU:</span>
              <span>{fmtMoney(calculateFinal())}</span>
            </div>

            <div style={{ marginTop: "20px" }}>
              <label style={styles.label}>Phương thức thanh toán</label>
              <select
                style={{ ...styles.input, fontSize: "16px", padding: "12px" }}
                value={paymentForm.paymentMethod}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    paymentMethod: e.target.value,
                  })
                }
              >
                <option value="Tiền mặt">💵 Tiền mặt</option>
                <option value="Chuyển khoản">🏦 Chuyển khoản (QR)</option>
                <option value="Thẻ">💳 Thẻ tín dụng</option>
              </select>
            </div>

            <button onClick={handlePaymentSubmit} style={styles.payBtn}>
              XÁC NHẬN THANH TOÁN
            </button>
          </div>

          <button
            onClick={() => navigate("/reception")}
            style={styles.cancelBtn}
          >
            Quay lại trang chính
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

const styles = {
  billSection: {
    flex: 1,
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
  },
  controlSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  group: { marginBottom: "10px" },
  label: {
    display: "block",
    fontWeight: "bold",
    fontSize: "13px",
    marginBottom: "5px",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    outline: "none",
  },
  btnSearch: {
    padding: "0 15px",
    background: "#eee",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
  },
  memberInfo: {
    marginTop: "5px",
    padding: "8px",
    background: "#e8f5e9",
    borderRadius: "6px",
    fontSize: "13px",
  },
  finalBox: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    marginTop: "auto",
  },
  rowSummary: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  payBtn: {
    width: "100%",
    padding: "15px",
    background: "#4caf50",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "18px",
    fontWeight: "bold",
    marginTop: "20px",
    cursor: "pointer",
    transition: "0.2s",
  },
  cancelBtn: {
    width: "100%",
    padding: "12px",
    background: "transparent",
    border: "none",
    color: "#666",
    cursor: "pointer",
    textDecoration: "underline",
  },
};
