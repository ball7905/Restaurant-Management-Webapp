import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";

/*
 * ============================================================
 * GHI CHÚ DÀNH CHO BACKEND DEVELOPER
 * ============================================================
 *
 * CÁC API CẦN IMPLEMENT:
 *
 * 1. LỊCH SỬ NHẬP HÀNG
 *    GET /api/storage/history/imports?warehouse_type=dry|cool|frozen|tools
 *    Response: [{
 *      id, date, supplier, item, qty, price,
 *      warehouse_type: "dry"|"cool"|"frozen"|"tools"
 *    }]
 *    
 *
 * 2. LỊCH SỬ XUẤT KHO  ← MỚI THÊM
 *    GET /api/storage/history/exports?warehouse_type=...
 *    Response: [{
 *      id, date, item, qty, price,
 *      warehouse_type: "dry"|"cool"|"frozen"|"tools"
 *    }]
 *    
 *
 * 3. LỊCH SỬ KIỂM KÊ
 *    GET /api/storage/history/audits?warehouse_type=...
 *    Response: [{
 *      id, date, item, sys, real, diff, note, status,
 *      warehouse_type: "dry"|"cool"|"frozen"|"tools"
 *    }]
 *   
 *
 * YÊU CẦU CHUNG:
 *   - Middleware: Kiểm tra Bearer Token trong header Authorization.
 *   - Định dạng ngày: "YYYY-MM-DD HH:mm" để FE hiển thị trực tiếp.
 *   - Query param warehouse_type là optional (null = trả về tất cả).
 *   - CORS: Cho phép domain FE truy cập.
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
// CONFIG 4 loại kho (đồng bộ với StorageDashboard.jsx)
// ─────────────────────────────────────────────────────────────
const WAREHOUSE_TYPES = [
  { value: "dry",    label: "Kho Khô",     emoji: "🌾", color: "#f59e0b", bg: "#fffbeb" },
  { value: "cool",   label: "Kho Mát",     emoji: "🥬", color: "#10b981", bg: "#ecfdf5" },
  { value: "frozen", label: "Kho Đông",    emoji: "❄️", color: "#3b82f6", bg: "#eff6ff" },
  { value: "tools",  label: "Kho Công Cụ", emoji: "🔧", color: "#8b5cf6", bg: "#f5f3ff" },
];

const getWH = (value) => WAREHOUSE_TYPES.find((w) => w.value === value);

export default function HistoryDashboard() {

  // ─── STATE: TAB LOẠI GIAO DỊCH ────────────────────────────
  // "imports" | "exports" | "audits"
  const [activeTab, setActiveTab] = useState("imports");

  // ─── STATE: FILTER LOẠI KHO ───────────────────────────────
  // null = tất cả; "dry"|"cool"|"frozen"|"tools" = lọc theo kho
  // Gửi lên API qua query param ?warehouse_type=...
  const [filterWarehouse, setFilterWarehouse] = useState(null);

  // ─── STATE: DỮ LIỆU ───────────────────────────────────────
  const [importLogs, setImportLogs] = useState([]);
  const [exportLogs, setExportLogs] = useState([]);
  const [auditLogs,  setAuditLogs]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + sessionStorage.getItem("token"),
  });

  // ─────────────────────────────────────────────────────────
  // LOAD LỊCH SỬ NHẬP HÀNG
  // GET /api/storage/history/imports?warehouse_type=...
  // warehouse_type là optional – null thì bỏ qua param
  // ─────────────────────────────────────────────────────────
  async function loadImports() {
    setLoading(true); setError("");
    try {
      const params = filterWarehouse ? `?warehouse_type=${filterWarehouse}` : "";
      const res = await fetch(`http://localhost:3000/api/storage/history/imports${params}`, { headers: getHeaders() });
      if (res.ok) {
        setImportLogs(await res.json());
      } else {
        // Mock data dùng để test khi chưa có backend
        setImportLogs([
          { id: 1, date: "2026-04-25 08:30", supplier: "Nông Trại Xanh", item: "Thịt Bò Thăn", qty: 20, price: 250000, warehouse_type: "frozen" },
          { id: 2, date: "2026-04-24 09:00", supplier: "Nông Trại B",    item: "Gạo Tám Thơm",  qty: 50, price: 20000,  warehouse_type: "dry"    },
          { id: 3, date: "2026-04-23 07:45", supplier: "Rau Củ Sạch",    item: "Rau Muống",     qty: 10, price: 12000,  warehouse_type: "cool"   },
        ]);
        console.warn("Backend chưa sẵn sàng, đang dùng mock data.");
      }
    } catch { setError("Lỗi kết nối máy chủ"); }
    finally  { setLoading(false); }
  }

  // ─────────────────────────────────────────────────────────
  // LOAD LỊCH SỬ XUẤT KHO  ← MỚI THÊM
  // GET /api/storage/history/exports?warehouse_type=...
  // ─────────────────────────────────────────────────────────
  async function loadExports() {
    setLoading(true); setError("");
    try {
      const params = filterWarehouse ? `?warehouse_type=${filterWarehouse}` : "";
      const res = await fetch(`http://localhost:3000/api/storage/history/exports${params}`, { headers: getHeaders() });
      if (res.ok) {
        setExportLogs(await res.json());
      } else {
        // Mock data
        setExportLogs([
          { id: 1, date: "2026-04-25 11:00", item: "Thịt Bò Thăn", qty: 5,  price: 250000, warehouse_type: "frozen" },
          { id: 2, date: "2026-04-24 14:30", item: "Đường",         qty: 10, price: 18000,  warehouse_type: "dry"    },
        ]);
        console.warn("Backend chưa sẵn sàng, đang dùng mock data.");
      }
    } catch { setError("Lỗi kết nối máy chủ"); }
    finally  { setLoading(false); }
  }

  // ─────────────────────────────────────────────────────────
  // LOAD LỊCH SỬ KIỂM KÊ
  // GET /api/storage/history/audits?warehouse_type=...
  // ─────────────────────────────────────────────────────────
  async function loadAudits() {
    setLoading(true); setError("");
    try {
      const params = filterWarehouse ? `?warehouse_type=${filterWarehouse}` : "";
      const res = await fetch(`http://localhost:3000/api/storage/history/audits${params}`, { headers: getHeaders() });
      if (res.ok) {
        setAuditLogs(await res.json());
      } else {
        // Mock data
        setAuditLogs([
          { id: 1, date: "2026-04-24 22:00", item: "Gạo Tám Thơm", sys: 500, real: 495, diff: -5, note: "Hao hụt", status: "Hoàn tất", warehouse_type: "dry"    },
          { id: 2, date: "2026-04-23 21:00", item: "Thịt Bò",      sys: 55,  real: 50,  diff: -5, note: "Kiểm tra", status: "Hoàn tất", warehouse_type: "frozen" },
        ]);
      }
    } catch { setError("Lỗi kết nối máy chủ"); }
    finally  { setLoading(false); }
  }

  // Reload khi đổi tab hoặc đổi filter kho
  useEffect(() => {
    if (activeTab === "imports") loadImports();
    else if (activeTab === "exports") loadExports();
    else loadAudits();
  }, [activeTab, filterWarehouse]); // eslint-disable-line

  const fmtMoney = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

  // Màu badge trạng thái kiểm kê
  const statusStyle = (status) => {
    if (status === "Hoàn tất") return { background: "#e8f5e9", color: "#2e7d32" };
    if (status === "Đang xử lý") return { background: "#fff3e0", color: "#e65100" };
    return { background: "#f5f5f5", color: "#555" };
  };

  return (
    <DashboardLayout>

      {/* ── HEADER ── */}
      <div style={S.header}>
        <h2 style={{ color: "#5a381e", margin: 0 }}>📜 Lịch Sử Giao Dịch Kho</h2>

        {/* Tab loại giao dịch */}
        <div style={S.tabGroup}>
          <button style={activeTab === "imports" ? S.tabActive : S.tab} onClick={() => setActiveTab("imports")}>
            📥 Nhập Hàng
          </button>
          <button style={activeTab === "exports" ? S.tabActive : S.tab} onClick={() => setActiveTab("exports")}>
            📤 Xuất Kho
          </button>
          <button style={activeTab === "audits"  ? S.tabActive : S.tab} onClick={() => setActiveTab("audits")}>
            📋 Kiểm Kê
          </button>
        </div>
      </div>

      {/* ── FILTER LOẠI KHO ──
          Thay đổi filterWarehouse → useEffect tự reload API với query param mới.
          Backend dùng warehouse_type làm điều kiện WHERE.
      */}
      <div style={S.warehouseFilter}>
        <span style={S.filterLabel}>Lọc theo kho:</span>

        {/* Nút "Tất cả" */}
        <button
          onClick={() => setFilterWarehouse(null)}
          style={{ ...S.filterBtn, ...(filterWarehouse === null ? S.filterBtnActive : {}) }}
        >
          🏪 Tất Cả
        </button>

        {/* Nút từng loại kho */}
        {WAREHOUSE_TYPES.map((w) => (
          <button
            key={w.value}
            onClick={() => setFilterWarehouse(w.value)}
            style={{
              ...S.filterBtn,
              ...(filterWarehouse === w.value
                ? { ...S.filterBtnActive, background: w.bg, color: w.color, borderColor: w.color }
                : {}),
            }}
          >
            {w.emoji} {w.label}
          </button>
        ))}
      </div>

      {error && <div style={S.errorMsg}>⚠️ {error}</div>}

      {/* ── BẢNG DỮ LIỆU ── */}
      <div style={S.card}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>Đang tải dữ liệu...</div>
        ) : (

          <>
            {/* ── TAB NHẬP HÀNG ─────────────────────────────
                Dữ liệu: GET /api/storage/history/imports
                Cột "Loại Kho" dùng badge màu để phân biệt nhanh.
            */}
            {activeTab === "imports" && (
              <>
                {importLogs.length === 0 ? (
                  <div style={S.emptyState}>Chưa có lịch sử nhập hàng</div>
                ) : (
                  <table style={S.table}>
                    <thead>
                      <tr style={{ background: "#f0f4c3" }}>
                        <th style={S.th}>Thời gian</th>
                        <th style={S.th}>Loại Kho</th>
                        <th style={S.th}>Nhà Cung Cấp</th>
                        <th style={S.th}>Nguyên Liệu</th>
                        <th style={S.th}>Số Lượng</th>
                        <th style={S.th}>Đơn Giá</th>
                        <th style={S.th}>Thành Tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importLogs.map((log) => {
                        const w = getWH(log.warehouse_type);
                        return (
                          <tr key={log.id} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={S.td}>{log.date}</td>
                            <td style={S.td}>
                              {w && <span style={{ ...S.whBadge, background: w.bg, color: w.color, border: `1px solid ${w.color}` }}>{w.emoji} {w.label}</span>}
                            </td>
                            <td style={S.td}>{log.supplier}</td>
                            <td style={{ ...S.td, fontWeight: "bold" }}>{log.item}</td>
                            <td style={{ ...S.td, color: "#2e7d32" }}>+{log.qty}</td>
                            <td style={S.td}>{fmtMoney(log.price)}</td>
                            <td style={{ ...S.td, fontWeight: "bold" }}>{fmtMoney(log.qty * log.price)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {/* ── TAB XUẤT KHO ──────────────────────────────
                Dữ liệu: GET /api/storage/history/exports
                MỚI: Tab này không có trong file gốc.
            */}
            {activeTab === "exports" && (
              <>
                {exportLogs.length === 0 ? (
                  <div style={S.emptyState}>Chưa có lịch sử xuất kho</div>
                ) : (
                  <table style={S.table}>
                    <thead>
                      <tr style={{ background: "#ffcdd2" }}>
                        <th style={S.th}>Thời gian</th>
                        <th style={S.th}>Loại Kho</th>
                        <th style={S.th}>Nguyên Liệu</th>
                        <th style={S.th}>Số Lượng</th>
                        <th style={S.th}>Đơn Giá</th>
                        <th style={S.th}>Thành Tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportLogs.map((log) => {
                        const w = getWH(log.warehouse_type);
                        return (
                          <tr key={log.id} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={S.td}>{log.date}</td>
                            <td style={S.td}>
                              {w && <span style={{ ...S.whBadge, background: w.bg, color: w.color, border: `1px solid ${w.color}` }}>{w.emoji} {w.label}</span>}
                            </td>
                            <td style={{ ...S.td, fontWeight: "bold" }}>{log.item}</td>
                            <td style={{ ...S.td, color: "#c62828", fontWeight: "bold" }}>-{log.qty}</td>
                            <td style={S.td}>{fmtMoney(log.price)}</td>
                            <td style={{ ...S.td, fontWeight: "bold", color: "#c62828" }}>{fmtMoney(log.qty * log.price)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {/* ── TAB KIỂM KÊ ───────────────────────────────
                Dữ liệu: GET /api/storage/history/audits
                Cột "Loại Kho" thêm mới để dễ phân biệt.
            */}
            {activeTab === "audits" && (
              <>
                {auditLogs.length === 0 ? (
                  <div style={S.emptyState}>Chưa có lịch sử kiểm kê</div>
                ) : (
                  <table style={S.table}>
                    <thead>
                      <tr style={{ background: "#ffe0b2" }}>
                        <th style={S.th}>Thời gian</th>
                        <th style={S.th}>Loại Kho</th>
                        <th style={S.th}>Nguyên Liệu</th>
                        <th style={S.th}>Hệ Thống</th>
                        <th style={S.th}>Thực Tế</th>
                        <th style={S.th}>Chênh Lệch</th>
                        <th style={S.th}>Ghi Chú</th>
                        <th style={S.th}>Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => {
                        const w = getWH(log.warehouse_type);
                        return (
                          <tr key={log.id} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={S.td}>{log.date}</td>
                            <td style={S.td}>
                              {w && <span style={{ ...S.whBadge, background: w.bg, color: w.color, border: `1px solid ${w.color}` }}>{w.emoji} {w.label}</span>}
                            </td>
                            <td style={{ ...S.td, fontWeight: "bold" }}>{log.item}</td>
                            <td style={S.td}>{log.sys}</td>
                            <td style={S.td}>{log.real}</td>
                            <td style={{ ...S.td, fontWeight: "bold", color: log.diff < 0 ? "red" : log.diff > 0 ? "green" : "#555" }}>
                              {log.diff > 0 ? "+" : ""}{log.diff}
                            </td>
                            <td style={{ ...S.td, fontStyle: "italic" }}>{log.note}</td>
                            <td style={S.td}>
                              <span style={{ ...S.statusBadge, ...statusStyle(log.status) }}>{log.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const S = {
  header:         { marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" },
  tabGroup:       { display: "flex", gap: "8px" },
  tab:            { padding: "8px 16px", background: "#eee", border: "none", borderRadius: "20px", cursor: "pointer", color: "#666", fontSize: "13px" },
  tabActive:      { padding: "8px 16px", background: "#5a381e", border: "none", borderRadius: "20px", cursor: "pointer", color: "white", fontWeight: "bold", fontSize: "13px" },
  // Filter loại kho
  warehouseFilter:{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" },
  filterLabel:    { fontSize: "13px", color: "#666", fontWeight: "bold", whiteSpace: "nowrap" },
  filterBtn:      { padding: "5px 12px", border: "2px solid #e0d6cc", borderRadius: "20px", background: "white", cursor: "pointer", fontSize: "12px", color: "#888" },
  filterBtnActive:{ fontWeight: "bold", background: "#fdf6ef", color: "#5a381e", borderColor: "#5a381e" },
  // Bảng
  card:           { background: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" },
  table:          { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  th:             { textAlign: "left", padding: "12px", color: "#555", borderBottom: "2px solid #ccc" },
  td:             { padding: "12px", borderBottom: "1px solid #f5f5f5" },
  whBadge:        { display: "inline-block", padding: "3px 7px", borderRadius: "5px", fontSize: "11px", fontWeight: "bold", whiteSpace: "nowrap" },
  statusBadge:    { padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" },
  emptyState:     { textAlign: "center", padding: "40px", color: "#aaa", fontStyle: "italic" },
  errorMsg:       { backgroundColor: "#ffebee", color: "#c62828", padding: "12px 15px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #ef9a9a", fontWeight: "bold" },
};