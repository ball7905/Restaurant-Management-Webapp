import DashboardLayout from "../../components/DashboardLayout";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ManagerHome() {
  const [stats, setStats] = useState({
    revenueToday: 0,
    ordersToday: 0,
    customersToday: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("http://localhost:3000/api/manager/stats", {
          headers: {
            Authorization: "Bearer " + sessionStorage.getItem("token"),
          },
        });

        if (!res.ok) {
          setError("Không thể tải thống kê");
          return;
        }

        const data = await res.json();
        setStats(data);
      } catch {
        setError("Lỗi máy chủ");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <DashboardLayout>
      <div style={{ padding: "40px" }}>
        <h1 style={{ color: "#5a381e" }}>Bảng Điều Khiển Quản Lý</h1>
        <p style={{ color: "#666" }}>Tổng quan hoạt động trong ngày</p>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {loading && <p>Đang tải dữ liệu...</p>}

        {/* STATS */}
        {!loading && !error && (
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              marginTop: "20px",
            }}
          >
            <div style={cardStyle}>
              <h3>Doanh Thu Hôm Nay</h3>
              <p style={statValue}>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(stats.revenueToday)}
              </p>
            </div>

            <div style={cardStyle}>
              <h3>Đơn Hàng</h3>
              <p style={statValue}>{stats.ordersToday}</p>
            </div>

            <div style={cardStyle}>
              <h3>Lượt Khách</h3>
              <p style={statValue}>{stats.customersToday}</p>
            </div>
          </div>
        )}

        {/* MANAGEMENT LINKS */}
        <h2 style={{ marginTop: "35px", color: "#5a381e" }}>Công Cụ Quản Lý</h2>

        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            marginTop: "15px",
          }}
        >
          <Link to="/manager/employees" style={actionButton}>
            Quản Lý Nhân Viên
          </Link>

          <Link to="/manager/menu" style={actionButton}>
            Quản Lý Thực Đơn
          </Link>

          <Link to="/manager/reports" style={actionButton}>
            Xem Báo Cáo
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

const cardStyle = {
  background: "white",
  padding: "25px",
  minWidth: "250px",
  borderRadius: "12px",
  boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
};

const statValue = {
  fontSize: "32px",
  fontWeight: "bold",
  marginTop: "8px",
};

const actionButton = {
  padding: "16px 24px",
  background: "#b3541e",
  color: "white",
  borderRadius: "10px",
  textDecoration: "none",
  fontSize: "18px",
  fontWeight: "bold",
  textAlign: "center",
  minWidth: "230px",
  transition: "0.2s",
};
