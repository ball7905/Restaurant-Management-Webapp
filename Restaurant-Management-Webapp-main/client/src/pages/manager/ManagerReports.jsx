import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";

export default function ManagerReports() {
  const [activeTab, setActiveTab] = useState("view");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Helper để component con gọi lên cha để set thông báo
  const showSuccess = (msg) => {
    setError("");
    setSuccess(msg);
  };
  const showError = (msg) => {
    setSuccess("");
    setError(msg);
  };

  // Tự động ẩn thông báo
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <DashboardLayout>
      <h2 style={{ color: "#5a381e", marginBottom: "20px" }}>
        Báo Cáo & Thống Kê
      </h2>

      {/* KHU VỰC THÔNG BÁO */}
      {error && <div style={styles.errorMsg}>⚠️ {error}</div>}
      {success && <div style={styles.successMsg}>✅ {success}</div>}

      <div style={{ marginBottom: "20px", borderBottom: "1px solid #ddd" }}>
        <button
          style={{
            ...styles.tab,
            borderBottom: activeTab === "view" ? "3px solid #b3541e" : "none",
          }}
          onClick={() => setActiveTab("view")}
        >
          Xem Doanh Thu
        </button>
        <button
          style={{
            ...styles.tab,
            borderBottom:
              activeTab === "generate" ? "3px solid #b3541e" : "none",
          }}
          onClick={() => setActiveTab("generate")}
        >
          Lưu Báo Cáo Định Kỳ
        </button>
      </div>

      {activeTab === "view" ? (
        <ViewReport onError={showError} />
      ) : (
        <GenerateReport onSuccess={showSuccess} onError={showError} />
      )}
    </DashboardLayout>
  );
}

// --- SUB-COMPONENT 1: XEM BÁO CÁO ---
function ViewReport({ onError }) {
  const [data, setData] = useState([]);
  const [filterType, setFilterType] = useState("Tháng"); // Chỉ cần lọc theo loại
  const [loading, setLoading] = useState(false);

  // Load dữ liệu khi Filter thay đổi hoặc mới vào trang
  useEffect(() => {
    loadData();
  }, [filterType]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Gọi API vừa sửa ở Bước 1
      const res = await fetch(
        `http://localhost:3000/api/manager/reports/revenue?type=${filterType}`,
        {
          headers: {
            Authorization: "Bearer " + sessionStorage.getItem("token"),
          },
        }
      );
      const result = await res.json();

      if (res.ok) {
        setData(result);
      } else {
        onError(result.error);
      }
    } catch (err) {
      onError("Lỗi kết nối: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* FILTER BAR ĐƠN GIẢN HÓA */}
      <div style={styles.filterBar}>
        <label style={styles.label}>Xem báo cáo theo:</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={styles.input}
        >
          <option value="Tháng">Tháng</option>
          <option value="Quý">Quý</option>
          <option value="Năm">Năm</option>
        </select>
        <button onClick={loadData} style={styles.btn}>
          🔄 Làm mới
        </button>
      </div>

      <div
        style={{
          marginTop: "20px",
          background: "white",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        }}
      >
        <table
          className="table"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead style={{ background: "#f5f5f5" }}>
            <tr>
              <th style={{ padding: "12px", textAlign: "left" }}>Kỳ Báo Cáo</th>
              <th style={{ textAlign: "left" }}>Năm</th>
              <th style={{ textAlign: "right" }}>Tổng Doanh Thu</th>
              <th style={{ textAlign: "right" }}>Tổng Chi Phí</th>
              <th style={{ textAlign: "right", paddingRight: "20px" }}>
                Lợi Nhuận
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}

            {!loading && data.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  Chưa có báo cáo nào được lưu.
                </td>
              </tr>
            )}

            {data.map((row) => (
              <tr key={row.ID} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>
                  {row.LoaiBaoCao} {row.Ky}
                </td>
                <td>{row.Nam}</td>

                {/* DOANH THU (Màu xanh) */}
                <td
                  style={{
                    textAlign: "right",
                    fontWeight: "bold",
                    color: "#2e7d32",
                  }}
                >
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(row.TongDoanhThu)}
                </td>

                {/* CHI PHÍ (Màu đỏ nhạt) */}
                <td style={{ textAlign: "right", color: "#c62828" }}>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(row.TongChiPhi)}
                </td>

                {/* LỢI NHUẬN */}
                <td
                  style={{
                    textAlign: "right",
                    paddingRight: "20px",
                    fontWeight: "bold",
                    color: row.LoiNhuan >= 0 ? "#1565c0" : "red",
                  }}
                >
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(row.LoiNhuan)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT 2: TẠO BÁO CÁO ---
function GenerateReport({ onSuccess, onError }) {
  const [form, setForm] = useState({
    type: "Tháng",
    period: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [result, setResult] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!confirm("Hành động này sẽ lưu số liệu vào Database. Tiếp tục?"))
      return;

    try {
      const res = await fetch(
        "http://localhost:3000/api/manager/reports/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + sessionStorage.getItem("token"),
          },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();

      if (res.ok) {
        onSuccess(data.message); // Hiển thị message từ DB
        setResult(data.data);
      } else {
        onError(data.error); // Hiển thị error từ DB
      }
    } catch {
      onError("Lỗi kết nối");
    }
  };

  return (
    <div
      style={{
        maxWidth: "500px",
        background: "white",
        padding: "30px",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#5a381e" }}>
        Lưu Trữ Báo Cáo Định Kỳ
      </h3>

      <form
        onSubmit={handleGenerate}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          marginTop: "20px",
        }}
      >
        <div>
          <label style={styles.label}>Loại báo cáo:</label>
          <select
            style={styles.inputFull}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="Tháng">Tháng</option>
            <option value="Quý">Quý</option>
            <option value="Năm">Năm</option>
          </select>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
          }}
        >
          <div>
            <label style={styles.label}>Kỳ (Tháng/Quý):</label>
            <input
              type="number"
              style={styles.inputFull}
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
              disabled={form.type === "Năm"}
            />
          </div>
          <div>
            <label style={styles.label}>Năm:</label>
            <input
              type="number"
              style={styles.inputFull}
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </div>
        </div>

        <button style={styles.submitBtn}> Tính Toán & Lưu</button>
      </form>

      {result && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#e8f5e9",
            borderRadius: "8px",
            border: "1px solid #a5d6a7",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "#2e7d32" }}>Kết Quả:</h4>
          <div style={styles.resultRow}>
            <span>Doanh Thu:</span>{" "}
            <strong>{result.TongDoanhThu?.toLocaleString()} đ</strong>
          </div>
          <div style={styles.resultRow}>
            <span>Chi Phí:</span>{" "}
            <strong>{result.TongChiPhi?.toLocaleString()} đ</strong>
          </div>
          <div
            style={{
              ...styles.resultRow,
              borderTop: "1px dashed #ccc",
              paddingTop: "5px",
              marginTop: "5px",
            }}
          >
            <span>Lợi Nhuận:</span>
            <strong style={{ color: result.LoiNhuan >= 0 ? "blue" : "red" }}>
              {result.LoiNhuan?.toLocaleString()} đ
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  tab: {
    padding: "15px 20px",
    background: "none",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#555",
  },
  filterBar: {
    background: "white",
    padding: "15px",
    borderRadius: "8px",
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  },
  input: {
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  inputFull: {
    width: "100%",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  label: {
    fontWeight: "bold",
    fontSize: "13px",
    color: "#333",
    display: "block",
    marginBottom: "5px",
  },
  btn: {
    padding: "8px 16px",
    background: "#b3541e",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  submitBtn: {
    padding: "12px",
    background: "#2e7d32",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
  },
  resultRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "5px",
    fontSize: "15px",
  },
  errorMsg: {
    backgroundColor: "#ffebee",
    color: "#c62828",
    padding: "15px",
    marginBottom: "20px",
    borderRadius: "8px",
    border: "1px solid #ef9a9a",
    fontWeight: "bold",
    textAlign: "center",
  },
  successMsg: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    padding: "15px",
    marginBottom: "20px",
    borderRadius: "8px",
    border: "1px solid #a5d6a7",
    fontWeight: "bold",
    textAlign: "center",
  },
};
