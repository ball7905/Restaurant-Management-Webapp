import { useNavigate } from "react-router-dom";
export default function ErrorPage() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const roleHomeRoutes = {
    "Phục vụ": "/server",
    "Đầu bếp": "/chef",
    "Bếp trưởng": "/head-chef",
    "Lễ tân": "/reception",
    "Quản lý kho": "/storage",
    "Quản lý": "/manager",
  };
  const handleGoBack = () => {
    navigate(roleHomeRoutes[user.role] || "/");
  };
  return (
    <div className="page" style={{ textAlign: "center" }}>
      <div
        className="form"
        style={{
          maxWidth: "500px",
          padding: "30px 25px",
        }}
      >
        <h1 style={{ color: "black", marginBottom: "14px" }}>
          Trang không tồn tại!
        </h1>

        <p style={{ marginBottom: "22px", color: "#3a3a3a" }}>
          Đường dẫn bạn truy cập không đúng hoặc đã bị xóa.
        </p>

        <button
          className="btn"
          style={{ width: "100%" }}
          onClick={handleGoBack}
        >
          Quay lại bảng điều khiển
        </button>
      </div>
    </div>
  );
}
