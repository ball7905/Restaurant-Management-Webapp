import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";

export default function InventoryDashboard() {
  // --- STATE DỮ LIỆU ---
  const [ingredients, setIngredients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // --- STATE MODAL CHÍNH (TẠO PHIẾU) ---
  const [modalType, setModalType] = useState(null); // 'import' | 'audit' | null
  const [mainForm, setMainForm] = useState({
    supplier_id: "",
    items: [],
  });

  // --- STATE MODAL CON (NHẬP CHI TIẾT 1 DÒNG HÀNG) ---
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({
    item_id: "",
    item_name: "",
    unit: "",
    quantity: "",
    price: "",
    current_sys: 0,
  });

  // --- [NEW] STATE MODAL TẠO NHANH (MASTER DATA) ---
  const [showQuickAddSupplier, setShowQuickAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [showQuickAddIngredient, setShowQuickAddIngredient] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    unit: "",
    price: "",
  });

  // --- 1. LOAD DATA ---
  useEffect(() => {
    setIngredients([
      { id: 1, name: "Thịt Bò", unit: "Kg", quantity: 50.5, price: 250000 },
      { id: 2, name: "Thịt Heo", unit: "Kg", quantity: 8.0, price: 120000 },
      {
        id: 4,
        name: "Gạo Tám Thơm",
        unit: "Kg",
        quantity: 495.0,
        price: 20000,
      },
      { id: 15, name: "Đường", unit: "Kg", quantity: 5.0, price: 18000 },
    ]);
    setSuppliers([
      {
        id: 1,
        name: "Nông Trại B",
        phone: "0909123456",
        email: "b@farm.com",
        address: "Dong Nai",
      }, // Thêm field mẫu
      {
        id: 2,
        name: "Thịt G",
        phone: "0988777666",
        email: "g@meat.com",
        address: "HCMC",
      },
    ]);
  }, []);

  // --- 2. HANDLERS CHO FORM CHÍNH ---
  const openMainModal = (type) => {
    setModalType(type);
    setMainForm({ supplier_id: "", items: [] });
  };

  const closeMainModal = () => {
    setModalType(null);
  };

  const submitMainForm = () => {
    if (mainForm.items.length === 0)
      return alert("Chưa có dòng nguyên liệu nào!");
    if (modalType === "import" && !mainForm.supplier_id)
      return alert("Chưa chọn Nhà cung cấp!");

    const payload = {
      type: modalType,
      ...mainForm,
      created_at: new Date().toISOString(),
    };

    console.log("SUBMIT BATCH:", payload);
    alert("Đã lưu phiếu thành công!");
    closeMainModal();
  };

  const deleteRow = (index) => {
    const newItems = mainForm.items.filter((_, i) => i !== index);
    setMainForm({ ...mainForm, items: newItems });
  };

  // --- 3. HANDLERS CHO ITEM ROW ---
  const openItemModal = () => {
    setItemForm({
      item_id: "",
      item_name: "",
      unit: "",
      quantity: "",
      price: "",
      current_sys: 0,
    });
    setShowItemModal(true);
  };

  const handleItemSelect = (id) => {
    const ing = ingredients.find((i) => i.id === parseInt(id));
    if (!ing) return;
    setItemForm({
      ...itemForm,
      item_id: ing.id,
      item_name: ing.name,
      unit: ing.unit,
      price: modalType === "import" ? ing.price : "",
      current_sys: ing.quantity,
    });
  };

  const saveItemRow = () => {
    if (!itemForm.item_id || !itemForm.quantity)
      return alert("Vui lòng nhập đủ thông tin");
    setMainForm({
      ...mainForm,
      items: [...mainForm.items, { ...itemForm }],
    });
    setShowItemModal(false);
  };

  // --- [NEW] 4. HANDLERS TẠO NHANH ---

  // Tạo NCC Mới
  const handleCreateSupplier = () => {
    if (!newSupplier.name) return alert("Tên NCC không được để trống");

    // Giả lập gọi API tạo mới
    const newId = Date.now(); // Fake ID
    const newSupObj = { id: newId, ...newSupplier };

    setSuppliers([...suppliers, newSupObj]); // Cập nhật list
    setMainForm({ ...mainForm, supplier_id: newId }); // Auto select NCC vừa tạo

    alert(`Đã thêm NCC: ${newSupplier.name}`);
    setShowQuickAddSupplier(false);
    setNewSupplier({ name: "", phone: "", email: "", address: "" });
  };

  // Tạo Nguyên Liệu Mới
  const handleCreateIngredient = () => {
    if (!newIngredient.name || !newIngredient.unit)
      return alert("Thiếu tên hoặc đơn vị");

    // Giả lập gọi API tạo mới
    const newId = Date.now();
    const newIngObj = {
      id: newId,
      name: newIngredient.name,
      unit: newIngredient.unit,
      price: newIngredient.price || 0,
      quantity: 0, // Mới tạo nên tồn kho = 0
    };

    setIngredients([...ingredients, newIngObj]); // Cập nhật list

    // Auto fill vào form item hiện tại
    setItemForm({
      ...itemForm,
      item_id: newId,
      item_name: newIngObj.name,
      unit: newIngObj.unit,
      price: newIngObj.price,
      current_sys: 0,
    });

    alert(`Đã thêm nguyên liệu: ${newIngredient.name}`);
    setShowQuickAddIngredient(false);
    setNewIngredient({ name: "", unit: "", price: "" });
  };

  // Helper
  const fmtMoney = (n) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(n);

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div style={styles.header}>
        <h2 style={{ color: "#5a381e", margin: 0 }}>📦 Quản Lý Kho Hàng</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            style={{ ...styles.btn, background: "#ff9800" }}
            onClick={() => openMainModal("audit")}
          >
            Tạo Phiếu Kiểm Kê
          </button>
          <button
            style={{ ...styles.btn, background: "#4caf50" }}
            onClick={() => openMainModal("import")}
          >
            Tạo Phiếu Nhập Kho
          </button>
        </div>
      </div>

      {/* TABLE INVENTORY */}
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={{ background: "#f9f9f9" }}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Tên Nguyên Liệu</th>
              <th style={styles.th}>Đơn Vị</th>
              <th style={styles.th}>Tồn Kho</th>
              <th style={styles.th}>Đơn Giá Vốn</th>
              <th style={styles.th}>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={styles.td}>#{item.id}</td>
                <td style={{ ...styles.td, fontWeight: "bold" }}>
                  {item.name}
                </td>
                <td style={styles.td}>{item.unit}</td>
                <td style={styles.td}>{item.quantity}</td>
                <td style={styles.td}>{fmtMoney(item.price)}</td>
                <td style={styles.td}>
                  {item.quantity < 10 ? (
                    <span style={styles.statusLow}>Sắp hết</span>
                  ) : (
                    <span style={styles.statusOk}>Ổn định</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL CHÍNH (LAYER 1) --- */}
      {modalType && (
        <div style={styles.overlay}>
          <div style={styles.modalLarge}>
            <div style={styles.modalHeader}>
              <h3>
                {modalType === "import"
                  ? "📥 Phiếu Nhập Hàng Mới"
                  : "📋 Phiếu Kiểm Kê Kho"}
              </h3>
              <button onClick={closeMainModal} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <label style={styles.label}>Ngày tạo:</label>
                  <input
                    disabled
                    value={new Date().toLocaleString()}
                    style={styles.inputDisabled}
                  />
                </div>
              </div>

              {/* DANH SÁCH CHI TIẾT */}
              <div style={styles.itemsSection}>
                {/* Header: Tiêu đề + Nút thêm (Giống mẫu hình 2) */}
                <div style={styles.itemsHeader}>
                  <h4 style={{ margin: 0, fontSize: "16px" }}>
                    Danh sách chi tiết
                  </h4>
                  <button style={styles.addBtn} onClick={openItemModal}>
                    {/* Kiểm tra modalType để hiển thị chữ tương ứng */}
                    {modalType === "import"
                      ? "+ Thêm nguyên liệu"
                      : "+ Chọn nguyên liệu"}
                  </button>
                </div>

                <table style={{ ...styles.table, fontSize: "14px" }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Tên Hàng</th>
                      <th style={styles.th}>ĐVT</th>
                      {modalType === "import" ? (
                        <>
                          {/* Căn giữa các cột số liệu để đẹp hơn */}
                          <th style={styles.thCenter}>SL Nhập</th>
                          <th style={styles.th}>Đơn Giá</th>
                          <th style={styles.th}>Thành Tiền</th>
                        </>
                      ) : (
                        <>
                          <th style={styles.thCenter}>Tồn HT</th>
                          <th style={styles.thCenter}>SL Thực</th>
                          <th style={styles.thCenter}>Lệch</th>
                        </>
                      )}
                      {/* --- SỬA LỖI ALIGNMENT: Dùng thCenter cho cột Xóa --- */}
                      <th style={styles.thCenter}>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mainForm.items.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          style={{
                            textAlign: "center",
                            padding: "20px",
                            color: "#999",
                            fontStyle: "italic",
                          }}
                        >
                          Chưa có nguyên liệu nào được chọn
                        </td>
                      </tr>
                    )}
                    {mainForm.items.map((row, idx) => (
                      <tr key={idx}>
                        <td style={styles.td}>{row.item_name}</td>
                        <td style={styles.td}>{row.unit}</td>
                        {modalType === "import" ? (
                          <>
                            {/* Căn giữa nội dung số lượng */}
                            <td style={{ ...styles.tdCenter }}>
                              {row.quantity}
                            </td>
                            <td style={styles.td}>{fmtMoney(row.price)}</td>
                            <td style={styles.td}>
                              {fmtMoney(row.price * row.quantity)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={styles.tdCenter}>{row.current_sys}</td>
                            <td style={{ ...styles.tdCenter }}>
                              {row.quantity}
                            </td>
                            <td
                              style={{
                                ...styles.tdCenter,
                                color:
                                  row.quantity - row.current_sys < 0
                                    ? "red"
                                    : "green",
                              }}
                            >
                              {(row.quantity - row.current_sys).toFixed(2)}
                            </td>
                          </>
                        )}

                        {/* --- SỬA LỖI ALIGNMENT: Dùng tdCenter cho ô chứa nút xóa --- */}
                        <td style={styles.tdCenter}>
                          <button
                            onClick={() => deleteRow(idx)}
                            style={{
                              ...styles.iconBtn,
                              opacity: 0.7,
                              fontSize: "16px",
                            }}
                            title="Xóa dòng này"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.submitBtn} onClick={submitMainForm}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CON: CHỌN MÓN (LAYER 2) --- */}
      {showItemModal && (
        <div style={{ ...styles.overlay, zIndex: 1100 }}>
          <div style={styles.modalSmall}>
            <h4 style={{ marginTop: 0, marginBottom: "20px" }}>
              Thêm dòng chi tiết
            </h4>

            <label style={styles.label}>Chọn Nguyên Liệu:</label>
            <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
              <select
                style={{ ...styles.input, flex: 1, marginBottom: 0 }} // Đảm bảo marginBottom: 0
                value={itemForm.item_id}
                onChange={(e) => handleItemSelect(e.target.value)}
              >
                <option value="">-- Tìm kiếm --</option>
                {ingredients.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              {modalType === "import" && (
                <button
                  style={styles.addSmallBtn}
                  title="Tạo Nguyên Liệu Mới"
                  onClick={() => setShowQuickAddIngredient(true)}
                >
                  +
                </button>
              )}
            </div>

            {modalType === "import" && (
              <div>
                <label style={styles.label}>Nhà Cung Cấp:</label>
                <div style={{ display: "flex", gap: "5px" }}>
                  <select
                    style={{ ...styles.input, flex: 1, marginBottom: 0 }} // THÊM marginBottom: 0 Ở ĐÂY
                    value={mainForm.supplier_id}
                    onChange={(e) =>
                      setMainForm({ ...mainForm, supplier_id: e.target.value })
                    }
                  >
                    <option value="">-- Chọn Nhà Cung Cấp --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <button
                    style={styles.addSmallBtn}
                    title="Thêm NCC Mới"
                    onClick={() => setShowQuickAddSupplier(true)}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Đơn vị:</label>
                <input
                  disabled
                  value={itemForm.unit}
                  style={styles.inputDisabled}
                />
              </div>
              {modalType === "audit" && (
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Tồn HT:</label>
                  <input
                    disabled
                    value={itemForm.current_sys}
                    style={styles.inputDisabled}
                  />
                </div>
              )}
            </div>

            <label style={styles.label}>
              {modalType === "import" ? "Số lượng nhập:" : "Số lượng thực tế:"}
            </label>
            <input
              type="number"
              style={styles.input}
              autoFocus
              value={itemForm.quantity}
              onChange={(e) =>
                setItemForm({ ...itemForm, quantity: e.target.value })
              }
            />

            {modalType === "import" && (
              <>
                <label style={styles.label}>Đơn giá nhập:</label>
                <input
                  type="number"
                  style={styles.input}
                  value={itemForm.price}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, price: e.target.value })
                  }
                />
              </>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "15px",
              }}
            >
              <button
                onClick={() => setShowItemModal(false)}
                style={styles.cancelBtn}
              >
                Hủy
              </button>
              <button onClick={saveItemRow} style={styles.submitBtnSmall}>
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL POPUP: TẠO NHÀ CUNG CẤP (LAYER 3) --- */}
      {showQuickAddSupplier && (
        <div style={{ ...styles.overlay, zIndex: 1200 }}>
          <div style={styles.modalSmall}>
            <h4
              style={{ marginTop: 0, color: "#4caf50", marginBottom: "20px" }}
            >
              Thêm Nhà Cung Cấp
            </h4>

            <label style={styles.label}>Tên Nhà Cung Cấp:</label>
            <input
              style={styles.input}
              autoFocus
              value={newSupplier.name}
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, name: e.target.value })
              }
            />
            <label style={styles.label}>Số điện thoại:</label>
            <input
              style={styles.input}
              type="tel"
              value={newSupplier.phone}
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, phone: e.target.value })
              }
            />
            <label style={styles.label}>Email:</label>
            <input
              style={styles.input}
              value={newSupplier.email}
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, email: e.target.value })
              }
            />
            <label style={styles.label}>Địa chỉ:</label>
            <input
              style={styles.input}
              value={newSupplier.address}
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, address: e.target.value })
              }
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setShowQuickAddSupplier(false)}
                style={styles.cancelBtn}
              >
                Hủy
              </button>
              <button
                onClick={handleCreateSupplier}
                style={styles.submitBtnSmall}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL POPUP: TẠO NGUYÊN LIỆU (LAYER 3) --- */}
      {showQuickAddIngredient && (
        <div style={{ ...styles.overlay, zIndex: 1200 }}>
          <div style={styles.modalSmall}>
            <h4
              style={{ marginTop: 0, color: "#ff9800", marginBottom: "20px" }}
            >
              ✨ Thêm Nguyên Liệu Mới
            </h4>

            <label style={styles.label}>Tên Nguyên Liệu:</label>
            <input
              style={styles.input}
              autoFocus
              value={newIngredient.name}
              onChange={(e) =>
                setNewIngredient({ ...newIngredient, name: e.target.value })
              }
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Đơn vị tính:</label>
                <input
                  style={styles.input}
                  placeholder="Kg, Lít..."
                  value={newIngredient.unit}
                  onChange={(e) =>
                    setNewIngredient({ ...newIngredient, unit: e.target.value })
                  }
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Giá vốn:</label>
                <input
                  type="number"
                  style={styles.input}
                  value={newIngredient.price}
                  onChange={(e) =>
                    setNewIngredient({
                      ...newIngredient,
                      price: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              <button
                onClick={() => setShowQuickAddIngredient(false)}
                style={styles.cancelBtn}
              >
                Hủy
              </button>
              <button
                onClick={handleCreateIngredient}
                style={styles.submitBtnSmall}
              >
                Lưu Món
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// --- STYLES ---
const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  btn: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "6px",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  card: {
    background: "white",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "12px 15px",
    borderBottom: "2px solid #eee",
    color: "#444",
    fontWeight: "bold",
    backgroundColor: "#f5f5f5",
  },
  thCenter: {
    textAlign: "center",
    padding: "12px 15px",
    borderBottom: "2px solid #eee",
    color: "#444",
    fontWeight: "bold",
    backgroundColor: "#f5f5f5",
  },
  tdCenter: {
    padding: "12px 15px",
    borderBottom: "1px solid #f0f0f0",
    textAlign: "center",
  },
  td: {
    padding: "12px 15px",
    borderBottom: "1px solid #f0f0f0",
    color: "#333",
  },
  statusLow: {
    background: "#ffebee",
    color: "#c62828",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  statusOk: {
    background: "#e8f5e9",
    color: "#2e7d32",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  itemsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },

  addBtn: {
    background: "#e3f2fd", // Nền xanh nhạt
    color: "#1976d2", // Chữ xanh đậm
    border: "1px dashed #1976d2", // Viền nét đứt
    padding: "8px 15px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },

  // Modal Styles
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modalLarge: {
    background: "white",
    borderRadius: "10px",
    width: "800px",
    maxWidth: "95%",
    height: "90vh",
    display: "flex",
    flexDirection: "column",
  },
  modalSmall: {
    background: "white",
    borderRadius: "10px",
    width: "350px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    padding: "15px 20px",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalBody: { padding: "20px", overflowY: "auto", flex: 1 },
  modalFooter: {
    padding: "15px 20px",
    borderTop: "1px solid #eee",
    textAlign: "right",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#00003F",
    fontSize: "18px",
    cursor: "pointer",
  },

  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
    fontSize: "13px",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    marginBottom: "10px",
  },
  inputDisabled: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #eee",
    background: "#f5f5f5",
    color: "#777",
    marginBottom: "10px",
  },

  itemsSection: {
    border: "1px solid #eee",
    borderRadius: "8px",
    padding: "15px",
    marginTop: "10px",
  },
  // addBtn: { background: '#e3f2fd', color: '#1976d2', border: '1px dashed #1976d2', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  addSmallBtn: {
    background: "#4caf50",
    color: "white",
    border: "none",
    width: "40px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    height: "auto",
  },
  iconBtn: { background: "none", border: "none", cursor: "pointer" },

  submitBtn: {
    padding: "10px 25px",
    background: "#5a381e",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  submitBtnSmall: {
    padding: "8px 16px",
    background: "#4caf50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "8px 16px",
    background: "#ccc",
    color: "#333",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
