import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";

export default function ManageMenu() {
  const [menu, setMenu] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);

  // --- SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("all"); // 'all' | 'name' | 'category'

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "Mặn", // Mặc định là Mặn để khớp Constraint
    description: "",
    url: "",          // Đường dẫn hình ảnh món ăn (lấy từ DB)
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

  // --- FILTERED MENU ---
  const filteredMenu = menu.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const name = (item.Ten || item.name || "").toLowerCase();
    const category = (item.PhanLoai || item.category || "").toLowerCase();

    if (searchField === "name") return name.includes(q);
    if (searchField === "category") return category.includes(q);
    
    // 'all': tìm trong cả tên và phân loại
    return name.includes(q) || category.includes(q);
  });

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

      if (!editing) {
        setForm({ name: "", price: "", category: "Mặn", description: "", url: "" });
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
          
          {/* ===== SEARCH BAR (Format từ ManageEmployees) ===== */}
          <div style={styles.searchBar}>
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              style={styles.searchSelect}
            >
              <option value="all">Tất cả</option>
              <option value="name">Tên món</option>
              <option value="category">Phân loại</option>
            </select>

            <div style={styles.searchInputWrapper}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder={
                  searchField === "all"
                    ? "Tìm theo tên món hoặc phân loại..."
                    : searchField === "name"
                    ? "Nhập tên món ăn..."
                    : "Nhập phân loại (Mặn/Chay)..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={styles.clearBtn}
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>

            <span style={styles.resultCount}>
              {filteredMenu.length}/{menu.length} món ăn
            </span>
          </div>
          {/* ===== END SEARCH BAR ===== */}

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "25%" }}>Tên Món</th>
                  <th style={{ width: "15%" }}>Đơn Giá</th>
                  <th style={{ width: "15%" }}>Phân Loại</th>
                  <th style={{ width: "15%", textAlign: "center" }}>Hình Ảnh</th>
                  <th style={{ width: "20%", textAlign: "center" }}>
                    Hành Động
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                      Đang tải...
                    </td>
                  </tr>
                ) : filteredMenu.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      style={{
                        textAlign: "center",
                        padding: "30px",
                        color: "#999",
                        fontStyle: "italic",
                      }}
                    >
                      {searchQuery
                        ? `Không tìm thấy món ăn phù hợp với "${searchQuery}"`
                        : "Chưa có món ăn nào"}
                    </td>
                  </tr>
                ) : (
                  filteredMenu.map((item) => (
                    <tr key={item.ID || item.id}>
                      <td>
                        {/* Highlight tên món */}
                        {searchField === "name" || searchField === "all"
                          ? highlightText(item.Ten || item.name, searchQuery)
                          : item.Ten || item.name}
                      </td>
                      <td>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(item.DonGia || item.price)}
                      </td>
                      <td>
                        {/* Highlight phân loại */}
                        {searchField === "category" || searchField === "all"
                          ? highlightText(item.PhanLoai || item.category, searchQuery)
                          : item.PhanLoai || item.category}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {/* Hiển thị thumbnail ảnh món ăn từ trường url trong DB */}
                        {(item.HinhAnh || item.url) ? (
                          <img
                            src={item.HinhAnh || item.url}
                            alt={item.Ten || item.name}
                            style={imgStyles.thumbnail}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <span style={imgStyles.noImg}>Chưa có ảnh</span>
                        )}
                      </td>
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
            {editing ? `Cập Nhật (ID: ${editing.ID || editing.id})` : "Thêm Món Mới"}
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

            <div>
              <label style={styles.label}>Hình ảnh (URL)</label>
              <input
                placeholder="https://example.com/anh-mon-an.jpg"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                style={styles.input}
              />
              {/* Preview ảnh trực tiếp khi user nhập URL */}
              {form.url && (
                <div style={imgStyles.previewWrap}>
                  <img
                    src={form.url}
                    alt="Preview"
                    style={imgStyles.preview}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  <p style={imgStyles.previewLabel}>Preview ảnh</p>
                </div>
              )}
            </div>

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
                    url: "",
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

// --- HELPER: Highlight từ khóa trong text (Giống ManageEmployees) ---
function highlightText(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "#fff176", borderRadius: "2px", padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// --- IMAGE STYLES ---
const imgStyles = {
  // Thumbnail nhỏ hiển thị trong bảng danh sách
  thumbnail: {
    width: "60px",
    height: "60px",
    objectFit: "cover",
    borderRadius: "6px",
    border: "1px solid #e0d6cc",
    display: "block",
    margin: "0 auto",
  },
  // Text thay thế khi món chưa có ảnh
  noImg: {
    color: "#bbb",
    fontSize: "11px",
    fontStyle: "italic",
  },
  // Khung preview ảnh trong form nhập URL
  previewWrap: {
    marginTop: "8px",
    textAlign: "center",
    border: "1px dashed #c4b9a6",
    borderRadius: "8px",
    padding: "8px",
    background: "#fdf6ef",
  },
  // Ảnh preview trong form
  preview: {
    width: "100%",
    maxHeight: "180px",
    objectFit: "cover",
    borderRadius: "6px",
    display: "block",
  },
  // Caption dưới preview
  previewLabel: {
    margin: "6px 0 0",
    fontSize: "11px",
    color: "#888",
    fontStyle: "italic",
  },
};

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
  // --- SEARCH STYLES (Copy từ ManageEmployees) ---
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "white",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #e0d6cc",
    marginBottom: "12px",
    boxShadow: "0 2px 6px rgba(90,56,30,0.07)",
    flexWrap: "wrap",
  },
  searchSelect: {
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #c4b9a6",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#5a381e",
    background: "#fdf6ef",
    cursor: "pointer",
    outline: "none",
    minWidth: "110px",
  },
  searchInputWrapper: {
    flex: 1,
    minWidth: "200px",
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "10px",
    fontSize: "14px",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "8px 32px 8px 32px",
    borderRadius: "6px",
    border: "1px solid #c4b9a6",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  clearBtn: {
    position: "absolute",
    right: "8px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#999",
    fontSize: "12px",
    padding: "2px 4px",
    borderRadius: "50%",
    lineHeight: 1,
  },
  resultCount: {
    fontSize: "12px",
    color: "#888",
    whiteSpace: "nowrap",
    fontStyle: "italic",
  },
};