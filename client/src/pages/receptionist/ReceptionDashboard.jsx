import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";

export default function ReceptionDashboard() {
  const [tables, setTables] = useState([]);
  const [bookings, setBookings] = useState([]); // List bên phải

  const [selectedTable, setSelectedTable] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // FILTER STATE (Mặc định là Hôm nay và Giờ hiện tại)
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [filterHour, setFilterHour] = useState(new Date().getUTCHours());

  const [form, setForm] = useState({
    guest_name: "",
    phone: "",
    guest_count: "",
    note: "",
  });

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + sessionStorage.getItem("token"),
  });

  // Load Tables theo Filter Date & Hour
  function loadTables() {
    const url = `http://localhost:3000/api/reception/tables?date=${filterDate}&hour=${filterHour}`;
    fetch(url, { headers: getHeaders() })
      .then((res) => res.json())
      .then(setTables)
      .catch((err) => console.error("Lỗi tải bàn:", err));
  }

  // Load Bookings (List bên phải - có thể load chung hoặc riêng)
  function loadBookings() {
    fetch("http://localhost:3000/api/reception/bookings", {
      headers: getHeaders(),
    })
      .then((res) => res.json())
      .then(setBookings)
      .catch((err) => console.error("Lỗi tải đặt bàn:", err));
  }

  // Khi Filter thay đổi -> Reload Map
  useEffect(() => {
    loadTables();
  }, [filterDate, filterHour]);

  // Load Booking list lần đầu
  useEffect(() => {
    loadBookings();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.guest_name || !form.phone || !form.guest_count) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Ghép Date và Hour thành datetime string ISO
    // Format: YYYY-MM-DDTHH:00:00
    const bookingTime = `${filterDate}" "${String(filterHour).padStart(
      2,
      "0"
    )}:00:00Z`;

    try {
      const res = await fetch("http://localhost:3000/api/reception/book", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          ...form,
          table_id: selectedTable?.id || null,
          booking_time: bookingTime, // Sử dụng giờ từ Filter
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      setShowModal(false);
      setForm({ guest_name: "", phone: "", guest_count: "", note: "" });
      loadTables(); // Refresh Map
      loadBookings(); // Refresh List
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCheckIn(bookingId) {
    const serverId = prompt("Vui lòng nhập ID Nhân viên phục vụ bàn này:");

    // Validate: Nếu bắt buộc phải có nhân viên thì return nếu trống
    if (!serverId) return alert("Cần nhập ID phục vụ để nhận bàn!");
    if (!confirm("Khách đã đến? Nhận bàn ngay?")) return;
    try {
      const res = await fetch(
        `http://localhost:3000/api/reception/check-in/${bookingId}`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ server_id: serverId }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
      loadTables();

      loadBookings();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCancel(bookingId) {
    const reason = prompt("Lý do hủy:");
    if (reason === null) return;

    try {
      const res = await fetch(
        `http://localhost:3000/api/reception/cancel/${bookingId}`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ reason }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadTables();
      loadBookings();
    } catch (err) {
      alert(err.message);
    }
  }

  function getTableColor(status) {
    if (status === "Trống") return "#4caf50"; // Xanh
    if (status === "Đã đặt") return "#ff9800"; // Cam
    if (status === "Đang phục vụ") return "#e53935"; // Đỏ
    return "#9e9e9e";
  }

  // Generate mảng giờ 0-23
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <DashboardLayout>
      <h2 style={{ color: "#5a381e", marginBottom: "15px" }}>
        Bảng Điều Khiển Lễ Tân
      </h2>

      {/* FILTER BAR */}
      <div
        style={{
          background: "white",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          display: "flex",
          gap: "20px",
          alignItems: "center",
          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontWeight: "bold" }}>Ngày xem:</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={styles.filterInput}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontWeight: "bold" }}>Khung giờ:</label>
          <select
            value={filterHour}
            onChange={(e) => setFilterHour(parseInt(e.target.value))}
            style={styles.filterInput}
          >
            {hours.map((h) => (
              <option key={h} value={h}>
                {h}:00
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginLeft: "auto", fontStyle: "italic", color: "#666" }}>
          Đang xem trạng thái lúc:{" "}
          <strong>
            {filterHour}:00, {filterDate}
          </strong>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {/* SƠ ĐỒ BÀN */}
        <div style={{ flex: 2, minWidth: "300px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: "15px",
            }}
          >
            {tables.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  // Chỉ cho phép click để đặt bàn nếu bàn Trống
                  // Nếu bàn đã đặt/đang phục vụ thì có thể hiện thông tin chi tiết (tùy chọn)
                  if (t.status === "Trống") {
                    setSelectedTable(t);
                    setShowModal(true);
                  } else {
                    alert(
                      `Bàn ${t.id} đang ${t.status}.\nKhách: ${
                        t.guestName || "N/A"
                      }`
                    );
                  }
                }}
                style={{
                  padding: "15px",
                  borderRadius: "12px",
                  cursor: t.status === "Trống" ? "pointer" : "default",
                  color: "white",
                  textAlign: "center",
                  background: getTableColor(t.status),
                  boxShadow: "0 3px 6px rgba(0,0,0,0.15)",
                  position: "relative",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                  Bàn {t.id}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.9 }}>
                  {t.capacity} ghế
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    background: "rgba(0,0,0,0.2)",
                    padding: "4px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                >
                  {t.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LIST BÊN PHẢI (Lịch sử/Sắp tới) */}
        <div
          style={{
            flex: 1,
            minWidth: "350px",
            background: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <h3
            style={{
              color: "#5a381e",
              marginTop: 0,
              borderBottom: "2px solid #eee",
              paddingBottom: "10px",
            }}
          >
            Danh Sách Đơn Đặt
          </h3>

          {bookings.map((b) => (
            <div
              key={b.id}
              style={{ borderBottom: "1px dashed #ddd", padding: "15px 0" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "5px",
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: "1.05rem",
                    color: "#333",
                  }}
                >
                  {b.guestName}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    background: getTableColor(b.status),
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  {b.status}
                </span>
              </div>
              <div
                style={{ fontSize: "13px", color: "#555", lineHeight: "1.5" }}
              >
                <div>
                  {" "}
                  📅{" "}
                  {new Date(b.bookingTime).toLocaleString("vi-VN", {
                    timeZone: "UTC",
                  })}{" "}
                  (UTC)
                </div>
                <div>
                  📞 {b.phone} — 👥 {b.guestCount} khách
                </div>
                {b.tableId && (
                  <div>
                    🪑 <strong>Bàn {b.tableId}</strong>
                  </div>
                )}
              </div>

              {/* Nút hành động nhanh cho đơn "Đã đặt" */}
              {b.status === "Đã đặt" && (
                <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleCheckIn(b.id)}
                    style={{ ...styles.btn, background: "#4caf50" }}
                  >
                    ✓ Nhận
                  </button>
                  <button
                    onClick={() => handleCancel(b.id)}
                    style={{ ...styles.btn, background: "#f44336" }}
                  >
                    ✕ Hủy
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL ĐẶT BÀN (FORM ĐƠN GIẢN HÓA) */}
      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ color: "#5a381e", margin: 0 }}>
                Đặt Bàn {selectedTable?.id}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: "#f0f4c3",
                padding: "10px",
                borderRadius: "5px",
                marginBottom: "15px",
                fontSize: "14px",
                color: "#555",
              }}
            >
              🕒 Thời gian: <strong>{filterHour}:00</strong> ngày{" "}
              <strong>{filterDate}</strong>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div>
                <label style={styles.inputLabel}>Tên khách hàng</label>
                <input
                  placeholder="VD: Anh Nam"
                  value={form.guest_name}
                  onChange={(e) =>
                    setForm({ ...form, guest_name: e.target.value })
                  }
                  style={styles.input}
                  required
                  autoFocus
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div>
                  <label style={styles.inputLabel}>Số điện thoại</label>
                  <input
                    placeholder="090..."
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    style={styles.input}
                    required
                  />
                </div>
                <div>
                  <label style={styles.inputLabel}>Số khách</label>
                  <input
                    type="number"
                    value={form.guest_count}
                    onChange={(e) =>
                      setForm({ ...form, guest_count: e.target.value })
                    }
                    style={styles.input}
                    required
                    min="1"
                    placeholder="SL"
                  />
                </div>
              </div>

              <div>
                <label style={styles.inputLabel}>Ghi chú</label>
                <input
                  placeholder="VD: Có trẻ em, dị ứng..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  style={styles.input}
                />
              </div>

              <button style={styles.submitBtn}>Xác Nhận Đặt</button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

const styles = {
  filterInput: {
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
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
    padding: "25px",
    borderRadius: "12px",
    width: "400px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
  },
  inputLabel: {
    display: "block",
    marginBottom: "5px",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  submitBtn: {
    marginTop: "10px",
    width: "100%",
    padding: "12px",
    background: "#b3541e",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  btn: {
    border: "none",
    padding: "6px 12px",
    color: "white",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  },
};
