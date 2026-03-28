import { useEffect, useState } from "react";
// Đảm bảo đường dẫn import đúng
import DashboardLayout from "../../components/DashboardLayout.jsx";

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);
  const [phones, setPhones] = useState([]);
  const [newPhone, setNewPhone] = useState("");

  const [form, setForm] = useState({
    cccd: "",
    name: "",
    username: "",
    password: "",
    dob: "",
    startDate: new Date().toISOString().split("T")[0],
    salary: "",
    address: "",
    phone: "",
    role: "Phục vụ",
    workType: "Fulltime",
    supervisorId: "",
    positionDate: "",
    expertise: "",
    shift: "Sáng",
    materialGroup: "",
    language: "",
  });

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + sessionStorage.getItem("token"),
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

  // Load nhân viên
  async function loadEmployees() {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/manager/employees", {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setEmployees(data);
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  }

  async function loadPhones(employeeId) {
    try {
      const res = await fetch(
        `http://localhost:3000/api/manager/employee-phones/${employeeId}`,
        { headers: getHeaders() }
      );
      const data = await res.json();
      if (res.ok) setPhones(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  async function handleAddPhone() {
    if (!newPhone.trim()) return;
    try {
      const res = await fetch("http://localhost:3000/api/manager/add-phone", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ employeeId: editing.id, phone: newPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewPhone("");
        loadPhones(editing.id);
        setSuccess(data.message);
      } else {
        alert(data.error);
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    }
  }

  async function handleDeletePhone(phoneToDelete) {
    if (!confirm(`Xóa số ${phoneToDelete}?`)) return;
    try {
      const res = await fetch(
        "http://localhost:3000/api/manager/delete-phone",
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            employeeId: editing.id,
            phone: phoneToDelete,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        loadPhones(editing.id);
        setSuccess(data.message);
      } else {
        alert(data.error);
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const url = editing
      ? `http://localhost:3000/api/manager/update-employee/${editing.id}`
      : `http://localhost:3000/api/manager/add-employee`;
    const method = editing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        window.scrollTo(0, 0);
        return;
      }

      setSuccess(data.message);
      await loadEmployees();
      if (!editing) resetForm();
      window.scrollTo(0, 0);
    } catch {
      setError("Lỗi kết nối máy chủ");
    }
  }

  function resetForm() {
    setForm({
      cccd: "",
      name: "",
      username: "",
      password: "",
      dob: "",
      startDate: new Date().toISOString().split("T")[0],
      salary: "",
      address: "",
      phone: "",
      role: "Phục vụ",
      workType: "Fulltime",
      supervisorId: "",
      positionDate: "",
      expertise: "",
      shift: "Sáng",
      materialGroup: "",
      language: "",
    });
    setEditing(null);
    setPhones([]);
    setNewPhone("");
  }

  async function deleteEmployee(id) {
    if (!confirm("Xóa nhân viên này?")) return;
    try {
      const res = await fetch(
        `http://localhost:3000/api/manager/delete-employee/${id}`,
        {
          method: "POST",
          headers: getHeaders(),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess(data.message);
      loadEmployees();
    } catch {
      setError("Lỗi kết nối máy chủ");
    }
  }

  const renderRoleSpecificFields = () => {
    const isRequired = !editing;
    switch (form.role) {
      case "Phục vụ":
        return (
          <div>
            <label style={styles.label}>Ca làm việc {isRequired && "*"}</label>
            <select
              value={form.shift}
              onChange={(e) => setForm({ ...form, shift: e.target.value })}
              style={styles.input}
            >
              <option value="Sáng">Sáng</option>
              <option value="Chiều">Chiều</option>
              <option value="Tối">Tối</option>
              <option value="Cả ngày">Cả ngày</option>
            </select>
          </div>
        );
      case "Lễ tân":
        return (
          <div>
            <label style={styles.label}>Ngoại ngữ {isRequired && "*"}</label>
            <input
              placeholder="VD: Tiếng Anh"
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              style={styles.input}
              required={isRequired}
            />
          </div>
        );
      case "Đầu bếp":
        // [ĐÃ SỬA] Đưa ID Giám sát ra ngoài dùng chung, ở đây không cần nữa
        return null;
      case "Bếp trưởng":
        return (
          <>
            <div>
              <label style={styles.label}>Chuyên môn</label>
              <input
                value={form.expertise}
                onChange={(e) =>
                  setForm({ ...form, expertise: e.target.value })
                }
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Ngày nhận chức</label>
              <input
                type="date"
                value={form.positionDate}
                onChange={(e) =>
                  setForm({ ...form, positionDate: e.target.value })
                }
                style={styles.input}
              />
            </div>
          </>
        );
      case "Quản lý kho":
        return (
          <div>
            <label style={styles.label}>Nhóm nguyên liệu</label>
            <input
              value={form.materialGroup}
              onChange={(e) =>
                setForm({ ...form, materialGroup: e.target.value })
              }
              style={styles.input}
            />
          </div>
        );
      case "Quản lý":
        return (
          <div>
            <label style={styles.label}>
              Ngày nhận chức {isRequired && "*"}
            </label>
            <input
              type="date"
              value={form.positionDate}
              onChange={(e) =>
                setForm({ ...form, positionDate: e.target.value })
              }
              style={styles.input}
              required={isRequired}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <h2 style={{ color: "#5a381e", marginBottom: "20px" }}>
        Quản Lý Nhân Viên
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
        {/* LEFT: TABLE */}
        <div style={{ flex: 2, minWidth: "60%" }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>CCCD</th>
                  <th>Họ Tên</th>
                  <th>Chức Danh</th>
                  <th>SĐT</th>
                  <th style={{ textAlign: "center" }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id}>
                      <td>{emp.id}</td>
                      <td>{emp.cccd}</td>
                      <td>{emp.name}</td>
                      <td>{emp.role}</td>
                      <td>{emp.phone}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="btn"
                          style={{
                            marginRight: "5px",
                            padding: "5px 10px",
                            fontSize: "12px",
                          }}
                          onClick={() => {
                            setEditing(emp);
                            setForm((prev) => ({
                              ...prev,
                              name: emp.name,
                              username: emp.username,
                              role: emp.role,
                              phone: emp.phone || "",
                              cccd: emp.cccd || "",
                              password: "",
                              salary: "",
                              supervisorId: "",
                              expertise: "",
                              language: "",
                              materialGroup: "",
                              positionDate: "",
                            }));
                            setError("");
                            setSuccess("");
                            loadPhones(emp.id); // Load list SĐT phụ
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
                          onClick={() => deleteEmployee(emp.id)}
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

        {/* RIGHT: FORM */}
        <div className="form" style={{ flex: 1, minWidth: "350px" }}>
          <h3
            style={{
              borderBottom: "2px solid #b3541e",
              paddingBottom: "10px",
              marginBottom: "15px",
              color: "#5a381e",
            }}
          >
            {editing ? `Cập Nhật (ID: ${editing.id})` : "Thêm Nhân Viên Mới"}
          </h3>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* Account Info */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <div>
                <label style={styles.label}>Username {!editing && "*"}</label>
                <input
                  placeholder="VD: admin01"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  required={!editing}
                  style={styles.input}
                  disabled={editing !== null}
                />
              </div>
              <div>
                <label style={styles.label}>Password {!editing && "*"}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required={!editing}
                  style={styles.input}
                  placeholder={editing ? "Giữ nguyên" : ""}
                />
              </div>
            </div>

            {/* Personal Info */}
            <label style={styles.label}>Họ và tên {!editing && "*"}</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required={!editing}
              style={styles.input}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <div>
                <label style={styles.label}>CCCD {!editing && "*"}</label>
                <input
                  value={form.cccd}
                  maxLength={12}
                  onChange={(e) => setForm({ ...form, cccd: e.target.value })}
                  required={!editing}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Ngày sinh {!editing && "*"}</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  required={!editing}
                  style={styles.input}
                />
              </div>
            </div>

            {/* Nếu đang thêm mới thì hiển thị ô nhập SĐT chính, nếu đang sửa thì hiển thị trình quản lý SĐT */}
            {!editing ? (
              <div>
                <label style={styles.label}>SĐT Chính *</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>
            ) : (
              <div
                style={{
                  background: "#fff3e0",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ffe0b2",
                }}
              >
                <label style={{ ...styles.label, color: "#e65100" }}>
                  Quản lý Số Điện Thoại
                </label>
                <div
                  style={{ display: "flex", gap: "5px", marginBottom: "5px" }}
                >
                  <input
                    placeholder="Nhập SĐT mới..."
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    style={{ ...styles.input, marginBottom: 0 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddPhone}
                    style={{
                      padding: "5px 10px",
                      cursor: "pointer",
                      background: "#4caf50",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                    }}
                  >
                    Thêm
                  </button>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {phones.map((p, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "5px 0",
                        borderBottom: "1px dashed #ccc",
                      }}
                    >
                      <span>{p}</span>
                      <button
                        type="button"
                        onClick={() => handleDeletePhone(p)}
                        style={{
                          color: "red",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        Xóa
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <label style={styles.label}>Địa chỉ</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              style={styles.input}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <div>
                <label style={styles.label}>Lương {!editing && "*"}</label>
                <input
                  type="number"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  required={!editing}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Ngày vào làm</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  style={styles.input}
                />
              </div>
            </div>

            <div
              style={{
                background: "#f9f9f9",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            >
              <label style={{ ...styles.label, color: "#b3541e" }}>
                Chức Danh & Nhiệm Vụ
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={{ ...styles.input, fontWeight: "bold" }}
              >
                <option value="Phục vụ">Phục vụ</option>
                <option value="Lễ tân">Lễ tân</option>
                <option value="Đầu bếp">Đầu bếp</option>
                <option value="Bếp trưởng">Bếp trưởng</option>
                <option value="Quản lý kho">Quản lý kho</option>
                <option value="Quản lý">Quản lý</option>
              </select>

              {/* --- HIỂN THỊ ID GIÁM SÁT CHO TẤT CẢ CHỨC DANH CẦN GIÁM SÁT --- */}
              {!["Quản lý", "Bếp trưởng"].includes(form.role) && (
                <div style={{ marginTop: "10px" }}>
                  <label style={styles.label}>
                    Người giám sát (ID){" "}
                    {form.role === "Đầu bếp" && !editing && "*"}
                  </label>
                  <input
                    type="number"
                    placeholder="Nhập ID (VD: ID Bếp trưởng/Quản lý)"
                    value={form.supervisorId}
                    onChange={(e) =>
                      setForm({ ...form, supervisorId: e.target.value })
                    }
                    style={styles.input}
                    required={form.role === "Đầu bếp" && !editing}
                  />
                </div>
              )}

              <div style={{ marginTop: "10px" }}>
                {renderRoleSpecificFields()}
              </div>
            </div>

            <label style={styles.label}>Hình thức làm việc</label>
            <select
              value={form.workType}
              onChange={(e) => setForm({ ...form, workType: e.target.value })}
              style={styles.input}
            >
              <option value="Fulltime">Toàn thời gian</option>
              <option value="Parttime">Bán thời gian</option>
            </select>

            <button
              className="btn"
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "12px",
                fontSize: "16px",
              }}
            >
              {editing ? "Lưu Thay Đổi" : "Thêm Nhân Viên"}
            </button>

            {editing && (
              <button
                type="button"
                className="btn"
                style={{
                  width: "100%",
                  background: "#7a4d28",
                  marginTop: "5px",
                }}
                onClick={resetForm}
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
