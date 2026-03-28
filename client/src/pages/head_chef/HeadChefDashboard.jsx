import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";

export default function ChefDashboard() {
  const [orders, setOrders] = useState([]);

  // Load dữ liệu hàng đợi
  const loadQueue = () => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:3000/api/chef/queue", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => {
        // Map dữ liệu để thêm trường uiStatus (dùng cho việc đổi màu ở frontend)
        const formattedData = data.map((order) => ({
          ...order,
          uiStatus: order.status === "Đang xử lý" ? "Đang chờ" : order.status,
        }));
        setOrders(formattedData);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 10000); // Tự động refresh mỗi 10s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id, action) => {
    // CASE 1: Bấm "Nấu" (Chỉ đổi màu UI, không gọi API DB)
    if (action === "COOKING") {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, uiStatus: "Đang nấu" } : o))
      );
      return;
    }

    // CASE 2: Bấm "Xong" (Gọi API cập nhật DB -> Sẵn sàng phục vụ)
    if (action === "READY") {
      const token = sessionStorage.getItem("token");
      try {
        const res = await fetch(
          `http://localhost:3000/api/chef/update-order/${id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
            },
            body: JSON.stringify({ status: "Sẵn sàng phục vụ" }),
          }
        );
        const data = await res.json();

        if (res.ok) {
          // Thành công -> Loại bỏ đơn khỏi hàng đợi
          setOrders((prev) => prev.filter((o) => o.id !== id));
        } else {
          alert(data.error);
        }
      } catch (err) {
        alert("Lỗi kết nối: " + err.message);
      }
    }
  };

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
        <h2 style={{ color: "#5a381e", margin: 0 }}>Hàng Đợi Bếp</h2>
        <button onClick={loadQueue} style={styles.refreshBtn}>
          🔄 Làm mới
        </button>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", color: "#666", marginTop: "50px" }}>
          Hiện không có món nào cần nấu.
        </div>
      ) : (
        <div style={styles.grid}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                ...styles.card,
                // Đổi màu viền nếu đang nấu
                borderLeft:
                  order.uiStatus === "Đang nấu"
                    ? "5px solid #ff9800"
                    : "5px solid #b3541e",
                background: order.uiStatus === "Đang nấu" ? "#fff8e1" : "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={styles.tableBadge}>{order.tableName}</span>
                <span style={{ color: "#666", fontSize: "14px" }}>
                  🕒 {order.time}
                </span>
              </div>

              <h3
                style={{ margin: "10px 0", fontSize: "1.3rem", color: "#333" }}
              >
                {order.dishName}
              </h3>

              {/* Hiển thị trạng thái hiện tại */}
              <div style={{ marginBottom: "10px", fontSize: "14px" }}>
                Trạng thái:{" "}
                <strong
                  style={{
                    color:
                      order.uiStatus === "Đang nấu" ? "#e65100" : "#2e7d32",
                  }}
                >
                  {order.uiStatus}
                </strong>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                {/* Ẩn nút Nấu nếu đang nấu */}
                {order.uiStatus !== "Đang nấu" && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, "COOKING")}
                    style={{ ...styles.btn, background: "#ff9800" }}
                  >
                    Nấu
                  </button>
                )}
                <button
                  onClick={() => handleUpdateStatus(order.id, "READY")}
                  style={{ ...styles.btn, background: "#4caf50" }}
                >
                  Xong
                </button>
              </div>
            </div>
          ))}
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
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    transition: "0.2s",
  },
  tableBadge: {
    background: "#5a381e",
    color: "white",
    padding: "4px 10px",
    borderRadius: "15px",
    fontSize: "13px",
    fontWeight: "bold",
  },
  btn: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
  refreshBtn: {
    padding: "8px 15px",
    background: "white",
    border: "1px solid #ddd",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#5a381e",
  },
};
