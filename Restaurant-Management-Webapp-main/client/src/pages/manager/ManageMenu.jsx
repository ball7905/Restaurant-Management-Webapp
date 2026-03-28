import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";

export default function ManageMenu() {
  const [menu, setMenu] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "Mặn", // Mặc định là Mặn để khớp Constraint
    description: "",
  });

  // Tự động ẩn thông báo sau 5s
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Load all menu items
  async function loadMenu() {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/manager/menu", {
        headers: {
          Authorization: "Bearer " + sessionStorage.getItem("token"),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setMenu(data);
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenu();
  }, []);

  // Create / Update menu item
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const itemId = editing ? editing.ID || editing.id : null;

    const url = editing
      ? `http://localhost:3000/api/manager/update-menu-item/${itemId}`
      : `http://localhost:3000/api/manager/add-menu-item`;

    const method = editing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + sessionStorage.getItem("token"),
        },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        window.scrollTo(0, 0);
        return;
      }

      setSuccess(data.message);
      await loadMenu();

      // Chỉ reset form khi thêm mới
      if (!editing) {
        setForm({ name: "", price: "", category: "Mặn", description: "" });
      }
      setEditing(null);
      window.scrollTo(0, 0);
    } catch {
      setError("Lỗi kết nối");
    }
  }

  // Delete menu item
  async function deleteItem(id) {
    if (!confirm("Bạn có chắc muốn xóa món này?")) return;

    try {
      const res = await fetch(
        `http://localhost:3000/api/manager/delete-menu-item/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + sessionStorage.getItem("token"),
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess(data.message);
      loadMenu();
    } catch {
      setError("Lỗi kết nối");
    }
  }

  return (
    <DashboardLayout>
      <h2 style={{ color: "#5a381e", marginBottom: "20px" }}>
        Quản Lý Thực Đơn
      </h2>

      {/* Thông báo Lỗi / Thành công */}
      {error && <div style={styles.errorMsg}>⚠️ {error}</div>}
      {success && <div style={styles.successMsg}>✅ {success}</div>}

      <div
        style={{
          display: "flex",
          gap: "30px",
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {/* LEFT: MENU TABLE */}
        <div style={{ flex: 2, minWidth: "60%" }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "30%" }}>Tên Món</th>
                  <th style={{ width: "20%" }}>Đơn Giá</th>
                  <th style={{ width: "20%" }}>Phân Loại</th>
                  <th style={{ width: "30%", textAlign: "center" }}>
                    Hành Động
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="4"
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : (
                  menu.map((item) => (
                    <tr key={item.ID || item.id}>
                      <td>{item.Ten || item.name}</td>
                      <td>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(item.DonGia || item.price)}
                      </td>
                      <td>{item.PhanLoai || item.category}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="btn"
                          style={{
                            marginRight: "10px",
                            padding: "5px 10px",
                            fontSize: "12px",
                          }}
                          onClick={() => {
                            setEditing(item);
                            setForm({
                              name: item.Ten || item.name,
                              price: item.DonGia || item.price,
                              category: item.PhanLoai || item.category,
                              description: item.MoTa || item.description || "",
                            });
                            setError("");
                            setSuccess("");
                            window.scrollTo(0, 0);
                          }}
                        >
                          Sửa
                        </button>

                        <button
                          className="btn"
                          style={{
                            background: "#c62828",
                            padding: "5px 10px",
                            fontSize: "12px",
                          }}
                          onClick={() => deleteItem(item.ID || item.id)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: MENU FORM */}
        <div className="form" style={{ flex: 1, minWidth: "300px" }}>
          <h3
            style={{
              borderBottom: "2px solid #b3541e",
              paddingBottom: "10px",
              marginBottom: "15px",
              color: "#5a381e",
            }}
          >
            {editing ? `Cập Nhật (ID: ${editing.ID})` : "Thêm Món Mới"}
          </h3>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div>
              <label style={styles.label}>Tên món *</label>
              <input
                placeholder="Ví dụ: Phở bò"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Đơn giá (VNĐ) *</label>
              <input
                placeholder="0"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                min="0"
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Phân loại</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={styles.input}
              >
                <option value="Mặn">Mặn</option>
                <option value="Chay">Chay</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Mô tả (Nguyên liệu/Ghi chú)</label>
              <textarea
                placeholder="Ví dụ: Nạm, gầu, gân..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                  fontFamily: "inherit",
                }}
                rows={3}
              />
            </div>

            {/* SAVE BUTTON */}
            <button
              className="btn"
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "12px",
                fontSize: "16px",
              }}
            >
              {editing ? "Lưu Thay Đổi" : "Thêm Món"}
            </button>

            {/* CANCEL BUTTON */}
            {editing && (
              <button
                type="button"
                className="btn"
                style={{
                  width: "100%",
                  marginTop: "5px",
                  background: "#7a4d28",
                }}
                onClick={() => {
                  setEditing(null);
                  setForm({
                    name: "",
                    price: "",
                    category: "Mặn",
                    description: "",
                  });
                  setError("");
                  setSuccess("");
                }}
              >
                Hủy Bỏ
              </button>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

const styles = {
  label: {
    fontSize: "12px",
    fontWeight: "bold",
    marginBottom: "4px",
    display: "block",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  errorMsg: {
    backgroundColor: "#ffebee",
    color: "#c62828",
    padding: "15px",
    marginBottom: "20px",
    borderRadius: "8px",
    border: "1px solid #ef9a9a",
    fontWeight: "bold",
  },
  successMsg: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    padding: "15px",
    marginBottom: "20px",
    borderRadius: "8px",
    border: "1px solid #a5d6a7",
    fontWeight: "bold",
  },
};
