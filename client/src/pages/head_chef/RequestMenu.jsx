// File: src/pages/MenuRequests.jsx
import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";

export default function MenuRequests() {
  const [requestType, setRequestType] = useState("Thêm");
  const [menuItems, setMenuItems] = useState([]);
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const [form, setForm] = useState({
    dishId: "",
    name: "",
    price: "",
    category: "Mặn",
    description: "",
    reason: "",
  });

  useEffect(() => {
    if (requestType !== "Thêm") {
      const token = sessionStorage.getItem("token");
      fetch("http://localhost:3000/api/manager/menu", {
        headers: { Authorization: "Bearer " + token },
      })
        .then((res) => res.json())
        .then(setMenuItems)
        .catch(console.error);
    }
  }, [requestType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/api/chef/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + sessionStorage.getItem("token"),
        },
        body: JSON.stringify({
          chefId: user.id,
          type: requestType,
          ...form,
        }),
      });
      const data = await res.json();
      alert(data.message || data.error);

      if (res.ok) {
        setForm({
          dishId: "",
          name: "",
          price: "",
          category: "Mặn",
          description: "",
          reason: "",
        });
      }
    } catch {
      alert("Lỗi kết nối server");
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h2 style={{ color: "#5a381e", marginBottom: "20px" }}>
          Đề Xuất Thực Đơn Mới
        </h2>

        <div style={styles.card}>
          <div style={{ marginBottom: "20px" }}>
            <label style={styles.label}>Loại yêu cầu:</label>
            <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
              {["Thêm", "Sửa", "Xóa"].map((type) => (
                <label
                  key={type}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <input
                    type="radio"
                    checked={requestType === type}
                    onChange={() => setRequestType(type)}
                  />
                  <span
                    style={{
                      fontWeight: requestType === type ? "bold" : "normal",
                    }}
                  >
                    {type} món
                  </span>
                </label>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {/* Chọn món (chỉ hiện khi Sửa/Xóa) */}
            {requestType !== "Thêm" && (
              <div>
                <label style={styles.label}>
                  Chọn món cần {requestType.toLowerCase()}:
                </label>
                <select
                  style={styles.input}
                  value={form.dishId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const item = menuItems.find((i) => i.ID == id);
                    setForm({
                      ...form,
                      dishId: id,
                      name: item?.Ten || "",
                      price: item?.DonGia || "",
                      category: item?.PhanLoai || "Mặn",
                      description: item?.MoTa || "",
                    });
                  }}
                  required
                >
                  <option value="">-- Chọn món từ thực đơn --</option>
                  {menuItems.map((i) => (
                    <option key={i.ID} value={i.ID}>
                      {i.Ten}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Form nhập thông tin (chỉ hiện khi Thêm/Sửa) */}
            {requestType !== "Xóa" && (
              <>
                <div>
                  <label style={styles.label}>Tên món:</label>
                  <input
                    style={styles.input}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Nhập tên món ăn..."
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  <div>
                    <label style={styles.label}>Đơn giá (VNĐ):</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Phân loại:</label>
                    <select
                      style={styles.input}
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                    >
                      <option value="Mặn">Mặn</option>
                      <option value="Chay">Chay</option>
                      <option value="Nước uống">Nước uống</option>
                      <option value="Tráng miệng">Tráng miệng</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={styles.label}>Mô tả chi tiết:</label>
                  <textarea
                    style={styles.input}
                    rows="3"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Thành phần, hương vị..."
                  />
                </div>
              </>
            )}

            {/* Lý do (Luôn hiện) */}
            <div>
              <label style={styles.label}>Lý do đề xuất:</label>
              <textarea
                style={styles.input}
                rows="2"
                placeholder={
                  requestType === "Xóa"
                    ? "Tại sao xóa món này?"
                    : "Tại sao thêm/sửa món này?"
                }
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required
              />
            </div>

            <button type="submit" style={styles.submitBtn}>
              🚀 Gửi Yêu Cầu Cho Quản Lý
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

const styles = {
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    marginTop: "5px",
    fontSize: "14px",
  },
  label: {
    fontWeight: "bold",
    fontSize: "14px",
    color: "#333",
    display: "block",
  },
  submitBtn: {
    padding: "12px",
    background: "#b3541e",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "10px",
    transition: "0.2s",
  },
};
