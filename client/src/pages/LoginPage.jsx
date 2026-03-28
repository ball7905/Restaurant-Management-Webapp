import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      console.log("Role nhận được từ API:", data.user.role); // Log để kiểm tra API

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      switch (data.user.role) {
        case "Phục vụ":
          navigate("/server");
          break;
        case "Đầu bếp":
          navigate("/chef");
          break;
        case "Bếp trưởng":
          navigate("/head-chef");
          break;
        case "Lễ tân":
          navigate("/reception");
          break;
        case "Quản lý":
          navigate("/manager");
          break;
        case "Quản lý kho":
          navigate("/storage");
          break;
        default:
          setError("Tài khoản của bạn chưa được phân quyền truy cập");
          navigate("/");
          sessionStorage.clear();
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối máy chủ");
    }
  }

  return (
    <div className="page">
      <div className="form" style={{ maxWidth: "380px" }}>
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
          Đăng Nhập Nhân Viên
        </h1>

        {error && (
          <p
            style={{ color: "red", marginBottom: "15px", textAlign: "center" }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleLogin}>
          <label>Tên đăng nhập</label>
          <input
            type="text"
            value={username}
            placeholder="Nhập tên đăng nhập"
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label>Mật khẩu</label>
          <input
            type="password"
            value={password}
            placeholder="Nhập mật khẩu"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Button */}
          <button
            className="btn"
            style={{
              width: "100%",
              marginTop: "10px",
            }}
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}
