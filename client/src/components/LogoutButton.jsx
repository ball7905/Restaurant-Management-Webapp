import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();
  function handleLogout() {
    // 1. Xóa thông tin phiên làm việc
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    // 2. Chuyển hướng về trang chủ/login
    // Sử dụng navigate để mượt mà hơn (SPA), hoặc window.location.href để reset sạch state
    navigate("/");
  }

  return (
    <button onClick={handleLogout} style={styles.button}>
      Đăng xuất
    </button>
  );
}

const styles = {
  button: {
    backgroundColor: "#b3541e",
    color: "white",
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    width: "100%",
    transition: "0.2s",
  },
};
