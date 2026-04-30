/**
 * ============================================================
 * StorageDashboard.jsx – Trang Quản Lý Kho Hàng
 * ============================================================
 *
 * TỔNG QUAN:
 *   Trang quản lý kho với 4 phân loại kho:
 *     - Kho Khô:     Gạo, đường, bột, gia vị khô...
 *     - Kho Mát:     Rau củ, trái cây, trứng, sữa...
 *     - Kho Đông:    Thịt, hải sản đông lạnh...
 *     - Kho Công Cụ: Dụng cụ bếp, bao bì, vật tư...
 *
 * CÁC API BACKEND CẦN IMPLEMENT:
 * ┌──────────────────────────────────────────────────────────────┐
 * │ [NGUYÊN LIỆU]                                                │
 * │   GET  /api/ingredients                                      │
 * │     Response: [{ id, name, unit, quantity, price,           │
 * │                   warehouse_type }]                          │
 * │     warehouse_type: "dry" | "cool" | "frozen" | "tools"     │
 * │                                                              │
 * │ [NHÀ CUNG CẤP]                                              │
 * │   GET  /api/suppliers                                        │
 * │   POST /api/suppliers                                        │
 * │                                                              │
 * │ [TẠO NHANH NGUYÊN LIỆU]                                     │
 * │   POST /api/ingredients                                      │
 * │     Body: { name, unit, price, warehouse_type }             │
 * │                                                              │
 * │ [PHIẾU]                                                      │
 * │   POST /api/stock/import   – Nhập kho                       │
 * │   POST /api/stock/export   – Xuất kho                       │
 * │   POST /api/stock/audit    – Kiểm kê                        │
 * └──────────────────────────────────────────────────────────────┘
 *
 * DATA MODELS:
 *   Payload phiếu nhập (POST /api/stock/import):
 *   { type: "import", supplier_id, warehouse_type, created_at,
 *     items: [{ item_id, item_name, unit, quantity, price }] }
 *
 *   Payload phiếu xuất (POST /api/stock/export):
 *   { type: "export", warehouse_type, created_at,
 *     items: [{ item_id, item_name, unit, quantity, price, current_sys }] }
 *
 *   Payload phiếu kiểm kê (POST /api/stock/audit):
 *   { type: "audit", warehouse_type, created_at,
 *     items: [{ item_id, item_name, unit, quantity, current_sys }] }
 *
 * LƯU Ý:
 *   - warehouse_type được gắn vào cả payload phiếu lẫn nguyên liệu.
 *   - Validation xuất kho: quantity <= current_sys (FE + backend).
 *   - Ngưỡng cảnh báo "Sắp hết": quantity < 10.
 * ============================================================
 */

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";

// ─────────────────────────────────────────────────────────────
// CONFIG: 4 loại kho
// Backend lưu trường warehouse_type với giá trị = value bên dưới
// ─────────────────────────────────────────────────────────────
const WAREHOUSE_TYPES = [
  { value: "dry",    label: "Kho Khô",     emoji: "🌾", color: "#f59e0b", bg: "#fffbeb", desc: "Gạo, đường, bột, gia vị khô" },
  { value: "cool",   label: "Kho Mát",     emoji: "🥬", color: "#10b981", bg: "#ecfdf5", desc: "Rau củ, trái cây, trứng, sữa" },
  { value: "frozen", label: "Kho Đông",    emoji: "❄️", color: "#3b82f6", bg: "#eff6ff", desc: "Thịt, hải sản đông lạnh" },
  { value: "tools",  label: "Kho Công Cụ", emoji: "🔧", color: "#8b5cf6", bg: "#f5f3ff", desc: "Dụng cụ bếp, bao bì, vật tư" },
];

const getWH = (value) => WAREHOUSE_TYPES.find((w) => w.value === value) || WAREHOUSE_TYPES[0];

export default function InventoryDashboard() {

  // ─── STATE: DỮ LIỆU ───────────────────────────────────────
  const [ingredients, setIngredients] = useState([]);
  const [suppliers,   setSuppliers]   = useState([]);

  // ─── STATE: FILTER / SEARCH / SORT ────────────────────────
  // activeWarehouse: null = tất cả | "dry"|"cool"|"frozen"|"tools"
  const [activeWarehouse, setActiveWarehouse] = useState(null);
  const [searchText,      setSearchText]      = useState("");
  const [sortField,       setSortField]       = useState("name");
  const [sortDir,         setSortDir]         = useState("asc");

  // ─── STATE: MODAL CHÍNH ───────────────────────────────────
  const [modalType, setModalType] = useState(null);
  const [mainForm,  setMainForm]  = useState({ supplier_id: "", warehouse_type: "dry", items: [] });

  // ─── STATE: MODAL CON (CHỌN NGUYÊN LIỆU) ─────────────────
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm,      setItemForm]      = useState({
    item_id: "", item_name: "", unit: "", quantity: "", price: "", current_sys: 0,
  });

  // ─── STATE: POPUP TẠO NHANH ───────────────────────────────
  const [showQuickAddSupplier,   setShowQuickAddSupplier]   = useState(false);
  const [newSupplier,            setNewSupplier]            = useState({ name: "", phone: "", email: "", address: "" });
  const [showQuickAddIngredient, setShowQuickAddIngredient] = useState(false);
  const [newIngredient,          setNewIngredient]          = useState({ name: "", unit: "", price: "" });

  // ─── 1. LOAD DATA ─────────────────────────────────────────
  // TODO: fetch("/api/ingredients") → setIngredients (có field warehouse_type)
  // TODO: fetch("/api/suppliers")   → setSuppliers
  useEffect(() => {
    setIngredients([
      { id: 1,  name: "Thịt Bò",      unit: "Kg",  quantity: 50.5,  price: 250000, warehouse_type: "frozen" },
      { id: 2,  name: "Thịt Heo",     unit: "Kg",  quantity: 8.0,   price: 120000, warehouse_type: "frozen" },
      { id: 3,  name: "Cá Hồi",       unit: "Kg",  quantity: 12.0,  price: 320000, warehouse_type: "frozen" },
      { id: 4,  name: "Gạo Tám Thơm", unit: "Kg",  quantity: 495.0, price: 20000,  warehouse_type: "dry"    },
      { id: 5,  name: "Đường",        unit: "Kg",  quantity: 5.0,   price: 18000,  warehouse_type: "dry"    },
      { id: 6,  name: "Bột Mì",       unit: "Kg",  quantity: 80.0,  price: 15000,  warehouse_type: "dry"    },
      { id: 7,  name: "Rau Muống",    unit: "Kg",  quantity: 7.0,   price: 12000,  warehouse_type: "cool"   },
      { id: 8,  name: "Cà Chua",      unit: "Kg",  quantity: 25.0,  price: 25000,  warehouse_type: "cool"   },
      { id: 9,  name: "Trứng Gà",     unit: "Quả", quantity: 200.0, price: 4000,   warehouse_type: "cool"   },
      { id: 10, name: "Dao Bếp",      unit: "Cái", quantity: 6.0,   price: 150000, warehouse_type: "tools"  },
      { id: 11, name: "Hộp Bao Bì",   unit: "Cái", quantity: 3.0,   price: 2000,   warehouse_type: "tools"  },
    ]);
    setSuppliers([
      { id: 1, name: "Nông Trại B", phone: "0909123456", email: "b@farm.com", address: "Dong Nai" },
      { id: 2, name: "Thịt G",      phone: "0988777666", email: "g@meat.com", address: "HCMC"     },
    ]);
  }, []);

  // ─── 2. FILTER + SEARCH + SORT ────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const filteredIngredients = [...ingredients]
    .filter((i) => !activeWarehouse || i.warehouse_type === activeWarehouse)
    .filter((i) => i.name.toLowerCase().includes(searchText.toLowerCase()))
    .sort((a, b) => {
      const m = sortDir === "asc" ? 1 : -1;
      if (sortField === "name")     return m * a.name.localeCompare(b.name);
      if (sortField === "quantity") return m * (a.quantity - b.quantity);
      if (sortField === "price")    return m * (a.price - b.price);
      return 0;
    });

  const SortIcon = ({ field }) =>
    sortField !== field
      ? <span style={{ color: "#bbb", marginLeft: 4 }}>↕</span>
      : <span style={{ color: "#5a381e", marginLeft: 4 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;

  // Badge đếm số nguyên liệu theo từng kho (hiển thị trên tab)
  const whCount = WAREHOUSE_TYPES.reduce((acc, w) => {
    acc[w.value] = ingredients.filter((i) => i.warehouse_type === w.value).length;
    return acc;
  }, {});

  // ─── 3. HANDLERS MODAL CHÍNH ──────────────────────────────
  const openMainModal = (type) => {
    setModalType(type);
    setMainForm({ supplier_id: "", warehouse_type: activeWarehouse || "dry", items: [] });
  };
  const closeMainModal = () => setModalType(null);

  // submitMainForm – Gửi phiếu lên backend
  // TODO: await fetch(`/api/stock/${modalType}`, { method:"POST", body: JSON.stringify(payload) })
  const submitMainForm = () => {
    if (mainForm.items.length === 0)                      return alert("Chưa có dòng nguyên liệu nào!");
    if (modalType === "import" && !mainForm.supplier_id)  return alert("Chưa chọn Nhà cung cấp!");
    const payload = {
      type:           modalType,
      warehouse_type: mainForm.warehouse_type, // "dry"|"cool"|"frozen"|"tools" → backend lưu vào phiếu
      supplier_id:    mainForm.supplier_id,
      items:          mainForm.items,
      created_at:     new Date().toISOString(),
    };
    console.log("SUBMIT PAYLOAD:", payload);
    alert("Đã lưu phiếu thành công!");
    closeMainModal();
  };

  const deleteRow = (idx) =>
    setMainForm({ ...mainForm, items: mainForm.items.filter((_, i) => i !== idx) });

  // ─── 4. HANDLERS MODAL CON ────────────────────────────────
  const openItemModal = () => {
    setItemForm({ item_id: "", item_name: "", unit: "", quantity: "", price: "", current_sys: 0 });
    setShowItemModal(true);
  };

  // Dropdown nguyên liệu được lọc theo kho của phiếu đang tạo
  const ingredientsForModal = ingredients.filter(
    (i) => i.warehouse_type === mainForm.warehouse_type
  );

  const handleItemSelect = (id) => {
    const ing = ingredients.find((i) => i.id === parseInt(id));
    if (!ing) return;
    setItemForm({
      ...itemForm,
      item_id:     ing.id,
      item_name:   ing.name,
      unit:        ing.unit,
      price:       modalType === "import" ? ing.price : "",
      current_sys: ing.quantity, // Snapshot tồn kho tại thời điểm chọn
    });
  };

  const saveItemRow = () => {
    if (!itemForm.item_id || !itemForm.quantity) return alert("Vui lòng nhập đủ thông tin");
    // Guard xuất kho – backend cần kiểm tra lại vì tồn kho có thể thay đổi
    if (modalType === "export" && Number(itemForm.quantity) > itemForm.current_sys)
      return alert(`Số lượng xuất (${itemForm.quantity}) vượt tồn kho (${itemForm.current_sys})!`);
    setMainForm({ ...mainForm, items: [...mainForm.items, { ...itemForm }] });
    setShowItemModal(false);
  };

  // ─── 5. HANDLERS TẠO NHANH ────────────────────────────────
  // TODO: POST /api/suppliers → dùng id thật từ response
  const handleCreateSupplier = () => {
    if (!newSupplier.name) return alert("Tên NCC không được để trống");
    const id = Date.now();
    setSuppliers([...suppliers, { id, ...newSupplier }]);
    setMainForm({ ...mainForm, supplier_id: id });
    alert(`Đã thêm NCC: ${newSupplier.name}`);
    setShowQuickAddSupplier(false);
    setNewSupplier({ name: "", phone: "", email: "", address: "" });
  };

  // TODO: POST /api/ingredients  body: { name, unit, price, warehouse_type }
  // warehouse_type tự động = mainForm.warehouse_type (kho của phiếu đang tạo)
  const handleCreateIngredient = () => {
    if (!newIngredient.name || !newIngredient.unit) return alert("Thiếu tên hoặc đơn vị");
    const id  = Date.now();
    const obj = { id, name: newIngredient.name, unit: newIngredient.unit, price: newIngredient.price || 0, quantity: 0, warehouse_type: mainForm.warehouse_type };
    setIngredients([...ingredients, obj]);
    setItemForm({ ...itemForm, item_id: id, item_name: obj.name, unit: obj.unit, price: obj.price, current_sys: 0 });
    alert(`Đã thêm nguyên liệu: ${newIngredient.name}`);
    setShowQuickAddIngredient(false);
    setNewIngredient({ name: "", unit: "", price: "" });
  };

  // ─── HELPERS & CONFIG ─────────────────────────────────────
  const fmtMoney = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

  const modalConfig = {
    import: { label: "📥 Phiếu Nhập Hàng Mới", color: "#4caf50", addLabel: "+ Thêm nguyên liệu" },
    export: { label: "📤 Phiếu Xuất Kho Mới",  color: "#e53935", addLabel: "+ Chọn nguyên liệu" },
    audit:  { label: "📋 Phiếu Kiểm Kê Kho",   color: "#ff9800", addLabel: "+ Chọn nguyên liệu" },
  };

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <DashboardLayout>

      {/* HEADER */}
      <div style={S.header}>
        <h2 style={{ color: "#5a381e", margin: 0 }}>📦 Quản Lý Kho Hàng</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ ...S.btn, background: "#ff9800" }} onClick={() => openMainModal("audit")}>📋 Tạo Phiếu Kiểm Kê</button>
          <button style={{ ...S.btn, background: "#e53935" }} onClick={() => openMainModal("export")}>📤 Tạo Phiếu Xuất Kho</button>
          <button style={{ ...S.btn, background: "#4caf50" }} onClick={() => openMainModal("import")}>📥 Tạo Phiếu Nhập Kho</button>
        </div>
      </div>

      {/* ── TAB PHÂN LOẠI KHO ──
          activeWarehouse = null → tất cả
          Switch tab KHÔNG gọi API, lọc trực tiếp trên mảng đã load.
      */}
      <div style={S.tabs}>
        {/* Tab "Tất cả" */}
        <button
          onClick={() => setActiveWarehouse(null)}
          style={{ ...S.tab, ...(activeWarehouse === null ? { ...S.tabActive, borderColor: "#5a381e", color: "#5a381e", background: "#fdf6ef" } : {}) }}
        >
          🏪 Tất Cả
          <span style={{ ...S.badge, background: "#5a381e" }}>{ingredients.length}</span>
        </button>

        {/* Tab từng loại kho */}
        {WAREHOUSE_TYPES.map((w) => (
          <button
            key={w.value}
            onClick={() => setActiveWarehouse(w.value)}
            style={{ ...S.tab, ...(activeWarehouse === w.value ? { ...S.tabActive, borderColor: w.color, color: w.color, background: w.bg } : {}) }}
          >
            {w.emoji} {w.label}
            <span style={{ ...S.badge, background: w.color }}>{whCount[w.value] || 0}</span>
          </button>
        ))}
      </div>

      {/* Mô tả kho đang xem */}
      {activeWarehouse && (() => {
        const w = getWH(activeWarehouse);
        return (
          <div style={{ ...S.whDesc, borderLeftColor: w.color }}>
            <strong>{w.emoji} {w.label}</strong> — {w.desc}
          </div>
        );
      })()}

      {/* TOOLBAR SEARCH */}
      <div style={S.toolbar}>
        <div style={S.searchWrap}>
          <span style={S.searchIcon}>🔍</span>
          <input style={S.searchInput} placeholder="Tìm kiếm nguyên liệu..."
            value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          {searchText && <button style={S.clearBtn} onClick={() => setSearchText("")}>✕</button>}
        </div>
        <span style={{ color: "#999", fontSize: "13px" }}>
          {filteredIngredients.length}/{ingredients.length} nguyên liệu
        </span>
      </div>

      {/* BẢNG TỒN KHO
          Dữ liệu: GET /api/ingredients (field warehouse_type bắt buộc)
          Cột "Loại Kho" hiện khi đang xem "Tất cả", ẩn khi lọc theo 1 kho.
      */}
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr style={{ background: "#f9f9f9" }}>
              <th style={S.th}>ID</th>
              <th style={{ ...S.th, cursor: "pointer", userSelect: "none" }} onClick={() => handleSort("name")}>
                Tên Nguyên Liệu <SortIcon field="name" />
              </th>
              <th style={S.th}>Đơn Vị</th>
              <th style={{ ...S.th, cursor: "pointer", userSelect: "none" }} onClick={() => handleSort("quantity")}>
                Tồn Kho <SortIcon field="quantity" />
              </th>
              <th style={{ ...S.th, cursor: "pointer", userSelect: "none" }} onClick={() => handleSort("price")}>
                Đơn Giá Vốn <SortIcon field="price" />
              </th>
              {/* Cột Loại Kho – chỉ hiện khi xem "Tất cả" */}
              {!activeWarehouse && <th style={S.th}>Loại Kho</th>}
              <th style={S.th}>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.length === 0 && (
              <tr>
                <td colSpan={!activeWarehouse ? 7 : 6} style={{ textAlign: "center", padding: "30px", color: "#aaa", fontStyle: "italic" }}>
                  Không tìm thấy nguyên liệu nào
                </td>
              </tr>
            )}
            {filteredIngredients.map((item) => {
              const w = getWH(item.warehouse_type);
              return (
                <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={S.td}>#{item.id}</td>
                  <td style={{ ...S.td, fontWeight: "bold" }}>{item.name}</td>
                  <td style={S.td}>{item.unit}</td>
                  <td style={S.td}>{item.quantity}</td>
                  <td style={S.td}>{fmtMoney(item.price)}</td>
                  {/* Badge loại kho – chỉ hiện ở tab "Tất cả" */}
                  {!activeWarehouse && (
                    <td style={S.td}>
                      <span style={{ ...S.whBadge, background: w.bg, color: w.color, border: `1px solid ${w.color}` }}>
                        {w.emoji} {w.label}
                      </span>
                    </td>
                  )}
                  <td style={S.td}>
                    {/* Ngưỡng cảnh báo: quantity < 10. TODO: lấy từ ingredient.min_threshold */}
                    {item.quantity < 10
                      ? <span style={S.statusLow}>Sắp hết</span>
                      : <span style={S.statusOk}>Ổn định</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>


      {/* ══════════════════════════════════════════════════════
          MODAL CHÍNH – LAYER 1
          Thêm field "Loại Kho" – gửi lên backend trong payload.
          Đổi warehouse_type → reset items (tránh nhầm kho).
      ══════════════════════════════════════════════════════ */}
      {modalType && (
        <div style={S.overlay}>
          <div style={S.modalLarge}>
            <div style={S.modalHeader}>
              <h3 style={{ margin: 0 }}>{modalConfig[modalType].label}</h3>
              <button onClick={closeMainModal} style={S.closeBtn}>✕</button>
            </div>
            <div style={S.modalBody}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <label style={S.label}>Ngày tạo:</label>
                  {/* Backend dùng created_at từ payload ISO string, không dùng giá trị UI này */}
                  <input disabled value={new Date().toLocaleString()} style={S.inputDisabled} />
                </div>
                <div>
                  <label style={S.label}>Loại Kho: *</label>
                  {/* warehouse_type được gửi lên backend trong payload */}
                  <select style={S.input} value={mainForm.warehouse_type}
                    onChange={(e) => setMainForm({ ...mainForm, warehouse_type: e.target.value, items: [] })}>
                    {WAREHOUSE_TYPES.map((w) => (
                      <option key={w.value} value={w.value}>{w.emoji} {w.label} – {w.desc}</option>
                    ))}
                  </select>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#888", fontStyle: "italic" }}>
                    ⚠️ Đổi loại kho sẽ xóa danh sách đã chọn
                  </p>
                </div>
              </div>

              <div style={S.itemsSection}>
                <div style={S.itemsHeader}>
                  <h4 style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    Danh sách chi tiết
                    {/* Badge kho hiện tại của phiếu */}
                    {(() => {
                      const w = getWH(mainForm.warehouse_type);
                      return <span style={{ ...S.whBadge, background: w.bg, color: w.color, border: `1px solid ${w.color}`, fontSize: "12px" }}>{w.emoji} {w.label}</span>;
                    })()}
                  </h4>
                  <button style={S.addBtn} onClick={openItemModal}>{modalConfig[modalType].addLabel}</button>
                </div>

                <table style={{ ...S.table, fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f9f9f9" }}>
                      <th style={S.th}>Tên Hàng</th>
                      <th style={S.th}>ĐVT</th>
                      {modalType === "import" && <><th style={S.thC}>SL Nhập</th><th style={S.th}>Đơn Giá</th><th style={S.th}>Thành Tiền</th></>}
                      {modalType === "export" && <><th style={S.thC}>Tồn HT</th><th style={S.thC}>SL Xuất</th><th style={S.th}>Đơn Giá</th><th style={S.th}>Thành Tiền</th></>}
                      {modalType === "audit"  && <><th style={S.thC}>Tồn HT</th><th style={S.thC}>SL Thực</th><th style={S.thC}>Lệch</th></>}
                      <th style={S.thC}>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mainForm.items.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "#999", fontStyle: "italic" }}>Chưa có nguyên liệu nào được chọn</td></tr>
                    )}
                    {mainForm.items.map((row, idx) => (
                      <tr key={idx}>
                        <td style={S.td}>{row.item_name}</td>
                        <td style={S.td}>{row.unit}</td>
                        {modalType === "import" && <>
                          <td style={S.tdC}>{row.quantity}</td>
                          <td style={S.td}>{fmtMoney(row.price)}</td>
                          <td style={{ ...S.td, fontWeight: "bold" }}>{fmtMoney(Number(row.price) * Number(row.quantity))}</td>
                        </>}
                        {modalType === "export" && <>
                          <td style={S.tdC}>{row.current_sys}</td>
                          <td style={{ ...S.tdC, color: "#e53935", fontWeight: "bold" }}>{row.quantity}</td>
                          <td style={S.td}>{fmtMoney(row.price)}</td>
                          <td style={{ ...S.td, fontWeight: "bold" }}>{fmtMoney(Number(row.price) * Number(row.quantity))}</td>
                        </>}
                        {modalType === "audit" && <>
                          <td style={S.tdC}>{row.current_sys}</td>
                          <td style={S.tdC}>{row.quantity}</td>
                          <td style={{ ...S.tdC, fontWeight: "bold", color: (Number(row.quantity) - row.current_sys) < 0 ? "red" : (Number(row.quantity) - row.current_sys) > 0 ? "green" : "#555" }}>
                            {(Number(row.quantity) - row.current_sys) > 0 ? "+" : ""}
                            {(Number(row.quantity) - row.current_sys).toFixed(2)}
                          </td>
                        </>}
                        <td style={S.tdC}>
                          <button onClick={() => deleteRow(idx)} style={{ ...S.iconBtn, fontSize: "16px" }} title="Xóa dòng">🗑</button>
                        </td>
                      </tr>
                    ))}
                    {/* Dòng tổng cộng – import & export */}
                    {(modalType === "import" || modalType === "export") && mainForm.items.length > 0 && (
                      <tr style={{ background: "#f5f5f5", fontWeight: "bold" }}>
                        <td colSpan={modalType === "import" ? 4 : 5} style={{ ...S.td, textAlign: "right" }}>Tổng cộng:</td>
                        <td style={{ ...S.td, color: modalType === "export" ? "#e53935" : "#2e7d32", fontSize: "15px" }}>
                          {fmtMoney(mainForm.items.reduce((s, r) => s + Number(r.price) * Number(r.quantity), 0))}
                        </td>
                        <td />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={S.modalFooter}>
              <button style={S.cancelBtn} onClick={closeMainModal}>Hủy</button>
              <button style={{ ...S.submitBtn, marginLeft: "10px", background: modalConfig[modalType].color }} onClick={submitMainForm}>Lưu Phiếu</button>
            </div>
          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════
          MODAL CON – LAYER 2 (zIndex: 1100)
          Dropdown nguyên liệu lọc theo mainForm.warehouse_type
          → chỉ hiện nguyên liệu của kho đang tạo phiếu.
      ══════════════════════════════════════════════════════ */}
      {showItemModal && (
        <div style={{ ...S.overlay, zIndex: 1100 }}>
          <div style={S.modalSmall}>
            <h4 style={{ marginTop: 0, marginBottom: "20px" }}>Thêm dòng chi tiết</h4>

            <label style={S.label}>
              Chọn Nguyên Liệu ({getWH(mainForm.warehouse_type).emoji} {getWH(mainForm.warehouse_type).label}):
            </label>
            <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
              <select style={{ ...S.input, flex: 1, marginBottom: 0 }} value={itemForm.item_id} onChange={(e) => handleItemSelect(e.target.value)}>
                <option value="">-- Chọn nguyên liệu --</option>
                {/* Chỉ hiện nguyên liệu thuộc kho đang tạo phiếu */}
                {ingredientsForModal.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
              {modalType === "import" && (
                <button style={S.addSmallBtn} title="Tạo nguyên liệu mới" onClick={() => setShowQuickAddIngredient(true)}>+</button>
              )}
            </div>

            {modalType === "import" && (
              <div>
                <label style={S.label}>Nhà Cung Cấp:</label>
                <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
                  <select style={{ ...S.input, flex: 1, marginBottom: 0 }} value={mainForm.supplier_id}
                    onChange={(e) => setMainForm({ ...mainForm, supplier_id: e.target.value })}>
                    <option value="">-- Chọn Nhà Cung Cấp --</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button style={S.addSmallBtn} title="Thêm NCC mới" onClick={() => setShowQuickAddSupplier(true)}>+</button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Đơn vị:</label>
                <input disabled value={itemForm.unit} style={S.inputDisabled} />
              </div>
              {(modalType === "audit" || modalType === "export") && (
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Tồn HT:</label>
                  <input disabled value={itemForm.current_sys} style={S.inputDisabled} />
                </div>
              )}
            </div>

            <label style={S.label}>
              {modalType === "import" ? "Số lượng nhập:" : modalType === "export" ? "Số lượng xuất:" : "Số lượng thực tế:"}
            </label>
            <input type="number" style={S.input} autoFocus value={itemForm.quantity}
              onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} />

            {(modalType === "import" || modalType === "export") && (
              <>
                <label style={S.label}>Đơn giá {modalType === "import" ? "nhập" : "xuất"}:</label>
                <input type="number" style={S.input} value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} />
              </>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "15px" }}>
              <button onClick={() => setShowItemModal(false)} style={S.cancelBtn}>Hủy</button>
              <button onClick={saveItemRow} style={S.submitBtnSm}>Thêm</button>
            </div>
          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════
          POPUP TẠO NHANH NCC – LAYER 3 (zIndex: 1200)
          TODO: POST /api/suppliers
      ══════════════════════════════════════════════════════ */}
      {showQuickAddSupplier && (
        <div style={{ ...S.overlay, zIndex: 1200 }}>
          <div style={S.modalSmall}>
            <h4 style={{ marginTop: 0, color: "#4caf50", marginBottom: "20px" }}>Thêm Nhà Cung Cấp</h4>
            <label style={S.label}>Tên Nhà Cung Cấp: *</label>
            <input style={S.input} autoFocus value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
            <label style={S.label}>Số điện thoại:</label>
            <input style={S.input} type="tel" value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
            <label style={S.label}>Email:</label>
            <input style={S.input} value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} />
            <label style={S.label}>Địa chỉ:</label>
            <input style={S.input} value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setShowQuickAddSupplier(false)} style={S.cancelBtn}>Hủy</button>
              <button onClick={handleCreateSupplier} style={S.submitBtnSm}>Lưu</button>
            </div>
          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════
          POPUP TẠO NHANH NGUYÊN LIỆU – LAYER 3 (zIndex: 1200)
          warehouse_type tự động = mainForm.warehouse_type.
          TODO: POST /api/ingredients  body: { name, unit, price, warehouse_type }
      ══════════════════════════════════════════════════════ */}
      {showQuickAddIngredient && (
        <div style={{ ...S.overlay, zIndex: 1200 }}>
          <div style={S.modalSmall}>
            <h4 style={{ marginTop: 0, color: "#ff9800", marginBottom: "8px" }}>✨ Thêm Nguyên Liệu Mới</h4>
            {/* Thông báo kho sẽ được gán – warehouse_type gửi lên API */}
            {(() => {
              const w = getWH(mainForm.warehouse_type);
              return (
                <div style={{ background: w.bg, border: `1px solid ${w.color}`, borderRadius: "6px", padding: "6px 10px", marginBottom: "14px", fontSize: "12px", color: w.color }}>
                  Sẽ được thêm vào: <strong>{w.emoji} {w.label}</strong>
                </div>
              );
            })()}
            <label style={S.label}>Tên Nguyên Liệu: *</label>
            <input style={S.input} autoFocus value={newIngredient.name} onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })} />
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Đơn vị tính: *</label>
                <input style={S.input} placeholder="Kg, Lít, Cái..." value={newIngredient.unit} onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Giá vốn mặc định:</label>
                <input type="number" style={S.input} value={newIngredient.price} onChange={(e) => setNewIngredient({ ...newIngredient, price: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button onClick={() => setShowQuickAddIngredient(false)} style={S.cancelBtn}>Hủy</button>
              <button onClick={handleCreateIngredient} style={S.submitBtnSm}>Lưu</button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES (viết tắt S để giảm độ dài code)
// ─────────────────────────────────────────────────────────────
const S = {
  header:      { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  btn:         { padding: "10px 18px", border: "none", borderRadius: "6px", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "13px" },
  // Tabs kho
  tabs:        { display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" },
  tab:         { display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", border: "2px solid #e0d6cc", borderRadius: "10px", background: "white", cursor: "pointer", fontSize: "13px", color: "#888" },
  tabActive:   { fontWeight: "bold" },
  badge:       { color: "white", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: "bold", minWidth: "20px", textAlign: "center" },
  whDesc:      { borderLeft: "4px solid #ccc", marginBottom: "10px", fontSize: "13px", color: "#666", background: "white", borderRadius: "0 6px 6px 0", padding: "8px 12px" },
  whBadge:     { display: "inline-block", padding: "3px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: "bold", whiteSpace: "nowrap" },
  // Search
  toolbar:     { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" },
  searchWrap:  { position: "relative", display: "flex", alignItems: "center" },
  searchIcon:  { position: "absolute", left: "10px", fontSize: "14px", pointerEvents: "none" },
  searchInput: { padding: "8px 34px", border: "1px solid #ddd", borderRadius: "20px", fontSize: "13px", outline: "none", width: "280px", background: "white" },
  clearBtn:    { position: "absolute", right: "10px", background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "13px" },
  // Bảng
  card:        { background: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" },
  table:       { width: "100%", borderCollapse: "collapse" },
  th:          { textAlign: "left",   padding: "12px 15px", borderBottom: "2px solid #eee", color: "#444", fontWeight: "bold", backgroundColor: "#f5f5f5" },
  thC:         { textAlign: "center", padding: "12px 15px", borderBottom: "2px solid #eee", color: "#444", fontWeight: "bold", backgroundColor: "#f5f5f5" },
  td:          { padding: "12px 15px", borderBottom: "1px solid #f0f0f0", color: "#333" },
  tdC:         { padding: "12px 15px", borderBottom: "1px solid #f0f0f0", textAlign: "center" },
  statusLow:   { background: "#ffebee", color: "#c62828", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" },
  statusOk:    { background: "#e8f5e9", color: "#2e7d32", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" },
  // Modal
  overlay:     { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalLarge:  { background: "white", borderRadius: "10px", width: "820px", maxWidth: "95%", height: "90vh", display: "flex", flexDirection: "column" },
  modalSmall:  { background: "white", borderRadius: "10px", width: "360px", padding: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" },
  modalHeader: { padding: "15px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalBody:   { padding: "20px", overflowY: "auto", flex: 1 },
  modalFooter: { padding: "15px 20px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end" },
  closeBtn:    { background: "none", border: "none", color: "#333", fontSize: "18px", cursor: "pointer" },
  // Form
  label:        { display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "13px", color: "#555" },
  input:        { width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", marginBottom: "10px", boxSizing: "border-box" },
  inputDisabled:{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #eee", background: "#f5f5f5", color: "#777", marginBottom: "10px" },
  itemsSection: { border: "1px solid #eee", borderRadius: "8px", padding: "15px", marginTop: "10px" },
  itemsHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" },
  addBtn:       { background: "#e3f2fd", color: "#1976d2", border: "1px dashed #1976d2", padding: "8px 15px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" },
  addSmallBtn:  { background: "#4caf50", color: "white", border: "none", width: "40px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "20px", display: "flex", justifyContent: "center", alignItems: "center" },
  iconBtn:      { background: "none", border: "none", cursor: "pointer", opacity: 0.7 },
  submitBtn:    { padding: "10px 25px", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" },
  submitBtnSm:  { padding: "8px 16px", background: "#4caf50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" },
  cancelBtn:    { padding: "8px 16px", background: "#eee", color: "#333", border: "none", borderRadius: "4px", cursor: "pointer" },
};