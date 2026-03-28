import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";

export default function ManagerMenuRequests() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const user = JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  async function loadRequests() {
    try {
      const res = await fetch("http://localhost:3000/api/manager/requests", {
        headers: {
          Authorization: "Bearer " + sessionStorage.getItem("token"),
        },
      });
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      setError(err);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRequests();
  }, []);

  const handleProcess = async (requestId, status) => {
    if (!confirm(`Bạn chắc chắn muốn ${status} yêu cầu này?`)) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(
        `http://localhost:3000/api/manager/process/${requestId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + sessionStorage.getItem("token"),
          },
          body: JSON.stringify({ requestId, managerId: user.id, status }),
        }
      );
      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message); // Hiển thị thông báo thành công từ DB
        loadRequests();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Lỗi kết nối đến máy chủ.");
    }
  };

  return (
    <DashboardLayout>
      <h2 style={{ color: "#5a381e" }}>Phê Duyệt Yêu Cầu Thực Đơn</h2>

      {error && <div style={styles.errorMsg}>⚠️ {error}</div>}
      {success && <div style={styles.successMsg}>✅ {success}</div>}

      <div
        style={{
          background: "white",
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <table
          className="table"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead style={{ background: "#f5f5f5" }}>
            <tr>
              <th style={thStyle}>Thời Gian</th>
              <th style={thStyle}>Bếp Trưởng</th>
              <th style={thStyle}>Loại</th>
              <th style={thStyle}>Chi Tiết Đề Xuất</th>
              <th style={thStyle}>Lý Do</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  style={{ padding: "20px", textAlign: "center" }}
                >
                  Không có yêu cầu nào đang chờ.
                </td>
              </tr>
            )}
            {requests.map((req) => (
              <tr key={req.ID} style={{ borderBottom: "1px solid #eee" }}>
                <td style={tdStyle}>
                  {new Date(req.ThoiGianTao).toLocaleString("vi-VN")}
                </td>
                <td style={tdStyle}>{req.TenBepTruong}</td>
                <td
                  style={{
                    ...tdStyle,
                    fontWeight: "bold",
                    color: req.LoaiYeuCau === "Xóa" ? "red" : "blue",
                  }}
                >
                  {req.LoaiYeuCau}
                </td>
                <td style={tdStyle}>
                  {req.LoaiYeuCau === "Xóa" ? (
                    <span>
                      Xóa món: <strong>{req.TenMonGoc}</strong>
                    </span>
                  ) : (
                    <div>
                      <div>
                        <strong>{req.TenMon_DeXuat}</strong>
                      </div>
                      <div style={{ color: "#666" }}>
                        {parseInt(req.DonGia_DeXuat).toLocaleString()} đ
                      </div>
                    </div>
                  )}
                </td>
                <td style={tdStyle}>{req.LyDo}</td>
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  <button
                    onClick={() => handleProcess(req.ID, "Đã duyệt")}
                    style={{
                      ...btnStyle,
                      background: "#4caf50",
                      marginRight: "5px",
                    }}
                  >
                    ✓ Duyệt
                  </button>
                  <button
                    onClick={() => handleProcess(req.ID, "Từ chối")}
                    style={{ ...btnStyle, background: "#f44336" }}
                  >
                    ✕ Từ chối
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

const thStyle = {
  padding: "15px",
  textAlign: "left",
  borderBottom: "2px solid #ddd",
};
const tdStyle = { padding: "15px" };
const btnStyle = {
  border: "none",
  padding: "8px 12px",
  color: "white",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "bold",
};
const styles = {
  errorMsg: {
    backgroundColor: "#ffebee",
    color: "#c62828",
    padding: "15px",
    marginBottom: "20px",
    borderRadius: "8px",
    border: "1px solid #ef9a9a",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  successMsg: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    padding: "15px",
    marginBottom: "20px",
    borderRadius: "8px",
    border: "1px solid #a5d6a7",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
