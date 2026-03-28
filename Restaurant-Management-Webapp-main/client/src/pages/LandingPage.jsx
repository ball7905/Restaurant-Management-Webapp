import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="page">
      {/* Title */}
      <h1 style={{ marginTop: "40px" }}>Cổng Thông Tin Nhân Viên</h1>

      {/* Subtitle */}
      <p>
        Để truy cập vào bảng điều khiển công việc, quản lý đơn hàng, đặt bàn,
        kho và báo cáo doanh thu. Vui lòng đăng nhập bằng tài khoản nhân viên
        của bạn.
      </p>

      {/* Button */}
      <Link to="/login">
        <button style={{ marginTop: "120px", marginBottom: "20px" }}>
          Đến trang Đăng nhập
        </button>
      </Link>

      {/* Small footer */}
      <p>©2025 Group_4_L08 Hệ thống quản lý nhà hàng</p>
    </div>
  );
}
