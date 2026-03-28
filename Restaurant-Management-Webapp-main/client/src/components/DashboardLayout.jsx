import { Link } from "react-router-dom";
import LogoutButton from "./LogoutButton";

export default function DashboardLayout({ children }) {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  // Hàm helper để kiểm tra role an toàn
  const hasRole = (...roles) => roles.includes(user.role);

  return (
    <div style={styles.layout}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        {/* Hiển thị chức danh viết hoa */}
        <h2 style={styles.role}>{user.role?.toUpperCase() || "NHÂN VIÊN"}</h2>

        {/* Role-Based Links: Khớp với Tiếng Việt trong Database */}

        {/* --- QUẢN LÝ --- */}
        {hasRole("Quản lý") && (
          <>
            <Link style={styles.link} to="/manager">
              Bảng Điều Khiển
            </Link>
            <Link style={styles.link} to="/manager/employees">
              Quản Lý Nhân Viên
            </Link>
            <Link style={styles.link} to="/manager/menu">
              Quản Lý Menu
            </Link>
            <Link style={styles.link} to="/manager/requests">
              Duyệt Cập Nhật Menu
            </Link>
            <Link style={styles.link} to="/manager/reports">
              Báo Cáo
            </Link>
          </>
        )}

        {/* --- PHỤC VỤ --- */}
        {hasRole("Phục vụ") && (
          <>
            <Link style={styles.link} to="/server">
              Gọi Món (Order)
            </Link>
          </>
        )}

        {/* --- BẾP (Đầu bếp) --- */}
        {hasRole("Đầu bếp") && (
          <Link style={styles.link} to="/chef">
            Hàng Đợi Bếp
          </Link>
        )}
        {/* --- BẾP (Bếp trưởng) --- */}
        {hasRole("Bếp trưởng") && (
          <>
            <Link style={styles.link} to="/head-chef">
              Hàng Đợi Bếp
            </Link>
            <Link style={styles.link} to="/head-chef/add-menu">
              Cập Nhật Món Ăn
            </Link>
          </>
        )}

        {/* --- LỄ TÂN --- */}
        {hasRole("Lễ tân") && (
          <>
            <Link style={styles.link} to="/reception">
              Đặt Bàn & Check-in
            </Link>
            <Link style={styles.link} to="/reception/payment">
              Thanh toán
            </Link>
          </>
        )}

        {/* --- QUẢN LÝ KHO --- */}
        {hasRole("Quản lý kho") && (
          <>
            <Link style={styles.link} to="/storage">
              Kho hàng
            </Link>
            <Link style={styles.link} to="/storage/history">
              Lịch sử
            </Link>
          </>
        )}

        <div style={{ marginTop: "auto" }}>
          <LogoutButton />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        <div style={styles.topbar}>
          {/* Hiển thị lời chào với tên nhân viên */}
          <h1 style={{ fontSize: "1.5rem", color: "#333" }}>
            Xin chào, <span style={{ color: "#b3541e" }}>{user.name}</span>
          </h1>
        </div>

        {children}
      </main>
    </div>
  );
}
/* ========================= */
/* INLINE STYLING OBJECT     */
/* ========================= */

const styles = {
  layout: {
    display: "flex",
    height: "100vh",
    fontFamily: "Segoe UI, sans-serif",
    background: "#f3f3f3",
    marginLeft: "240px", // ⭐ tránh bị che bởi sidebar
  },

  sidebar: {
    width: "240px",
    background: "#5a381e",
    color: "white",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    position: "fixed", // ⭐ GIỮ NGUYÊN KHI SCROLL
    top: 0,
    left: 0,
    bottom: 0,
    height: "100vh", // luôn full cao
  },
  role: {
    marginBottom: "20px",
    fontSize: "1.4rem",
    letterSpacing: "1px",
  },

  link: {
    color: "white",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: "6px",
    background: "#7a4d28",
    display: "block",
    transition: "0.2s",
  },

  main: {
    flex: 1,
    padding: "30px",
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
};
