import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";

export default function HistoryDashboard() {
  const [activeTab, setActiveTab] = useState("imports"); // 'imports' | 'audits'
  const [importLogs, setImportLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    // Mock API Data
    setImportLogs([
      { id: 101, date: "2023-11-08 08:00", supplier: "Nông Trại B", item: "Rau Muống", qty: 20, price: 15000 },
      { id: 102, date: "2023-11-08 08:05", supplier: "Thịt G", item: "Thịt Heo", qty: 100, price: 120000 },
    ]);

    setAuditLogs([
      { id: 501, date: "2023-11-07 16:00", item: "Đường", sys: 10, real: 8, diff: -2, note: "Hao hụt", status: "Đã xử lý" },
      { id: 502, date: "2023-11-07 16:15", item: "Gạo", sys: 500, real: 500, diff: 0, note: "Đủ", status: "Đã xử lý" },
    ]);
  }, []);

  const fmtMoney = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  return (
    <DashboardLayout>
      <div style={styles.header}>
        <h2 style={{color: '#5a381e', margin: 0}}>📜 Lịch Sử Giao Dịch Kho</h2>
        
        <div style={styles.tabGroup}>
          <button 
            style={activeTab === 'imports' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('imports')}
          >
            📥 Nhập Hàng
          </button>
          <button 
            style={activeTab === 'audits' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('audits')}
          >
            📋 Kiểm Kê
          </button>
        </div>
      </div>

      <div style={styles.card}>
        {/* TAB 1: NHẬP HÀNG */}
        {activeTab === 'imports' && (
          <table style={styles.table}>
            <thead>
              <tr style={{background: '#f0f4c3'}}>
                <th style={styles.th}>Thời gian</th>
                <th style={styles.th}>Nhà Cung Cấp</th>
                <th style={styles.th}>Nguyên Liệu</th>
                <th style={styles.th}>Số Lượng</th>
                <th style={styles.th}>Đơn Giá</th>
                <th style={styles.th}>Thành Tiền</th>
              </tr>
            </thead>
            <tbody>
              {importLogs.map(log => (
                <tr key={log.id} style={{borderBottom: '1px solid #eee'}}>
                  <td style={styles.td}>{log.date}</td>
                  <td style={styles.td}>{log.supplier}</td>
                  <td style={{...styles.td, fontWeight: 'bold'}}>{log.item}</td>
                  <td style={{...styles.td, color: '#2e7d32'}}>+{log.qty}</td>
                  <td style={styles.td}>{fmtMoney(log.price)}</td>
                  <td style={{...styles.td, fontWeight: 'bold'}}>{fmtMoney(log.qty * log.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* TAB 2: KIỂM KÊ */}
        {activeTab === 'audits' && (
          <table style={styles.table}>
            <thead>
              <tr style={{background: '#ffe0b2'}}>
                <th style={styles.th}>Thời gian</th>
                <th style={styles.th}>Nguyên Liệu</th>
                <th style={styles.th}>Hệ Thống</th>
                <th style={styles.th}>Thực Tế</th>
                <th style={styles.th}>Chênh Lệch</th>
                <th style={styles.th}>Ghi Chú</th>
                <th style={styles.th}>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id} style={{borderBottom: '1px solid #eee'}}>
                  <td style={styles.td}>{log.date}</td>
                  <td style={{...styles.td, fontWeight: 'bold'}}>{log.item}</td>
                  <td style={styles.td}>{log.sys}</td>
                  <td style={styles.td}>{log.real}</td>
                  <td style={{...styles.td, fontWeight: 'bold', color: log.diff < 0 ? 'red' : 'green'}}>
                    {log.diff > 0 ? '+' : ''}{log.diff}
                  </td>
                  <td style={{...styles.td, fontStyle: 'italic'}}>{log.note}</td>
                  <td style={styles.td}>
                    <span style={{
                      background: '#e8f5e9', color: '#2e7d32', padding: '2px 6px', borderRadius: '4px', fontSize: '11px'
                    }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}

const styles = {
  header: { marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  card: { background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { textAlign: 'left', padding: '12px', color: '#555', borderBottom: '2px solid #ccc' },
  td: { padding: '12px', borderBottom: '1px solid #f5f5f5' },
  tabGroup: { display: 'flex', gap: '10px' },
  tab: { padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '20px', cursor: 'pointer', color: '#666' },
  tabActive: { padding: '8px 16px', background: '#5a381e', border: 'none', borderRadius: '20px', cursor: 'pointer', color: 'white', fontWeight: 'bold' },
};