import "./index.css";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";

import WaiterDashBoard from "./pages/waiter/WaiterDashboard.jsx";
import ServerDashboard from "./pages/ServerDashboard";
import { HeadChefDashboard, RequestMenu } from "./pages/head_chef/";
import ChefDashboard from "./pages/chef/ChefDashboard.jsx";
import StorageDashboard from "./pages/storage/StorageDashboard.jsx";
import StorageHistory from "./pages/storage/StorageHistory.jsx";
import {
  ReceptionDashboard,
  PaymentPage,
  PaymentSelection,
} from "./pages/receptionist/";
import {
  ManageEmployees,
  ManagerHome,
  ManageMenu,
  ManagerMenuRequests,
  ManagerReports,
} from "./pages/manager/";
import AccessDenied from "./pages/AccessDenied";
import ErrorPage from "./pages/ErrorPage.jsx";

// Component bảo vệ route: Kiểm tra role của user
function ProtectedRoute({ children, roles }) {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  // Chưa đăng nhập -> Về trang login
  if (!user.role) return <Navigate to="/login" />;

  // Role không nằm trong danh sách cho phép -> Về trang từ chối truy cập
  if (!roles.includes(user.role)) return <Navigate to="/access-denied" />;

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Các trang Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/error" element={<ErrorPage />} />

      {/* Trang thông báo lỗi quyền hạn */}
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* ------------------ PHÂN QUYỀN (ROLE-BASED ROUTING) ------------------ */}

      {/* 1. Trang Phục vụ (Server) */}
      <Route
        path="/server"
        element={
          <ProtectedRoute roles={["Phục vụ"]}>
            <WaiterDashBoard />
          </ProtectedRoute>
        }
      />

      {/* 2. Trang Bếp (Chef) - Chỉ gồm đầu bếp */}
      <Route
        path="/chef"
        element={
          <ProtectedRoute roles={["Đầu bếp", "Bếp trưởng"]}>
            <ChefDashboard />
          </ProtectedRoute>
        }
      />

      {/* 2.1 Trang Bếp Trưởng (Head Chef) */}
      <Route
        path="/head-chef"
        element={
          <ProtectedRoute roles={["Bếp trưởng"]}>
            <HeadChefDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/head-chef/add-menu"
        element={
          <ProtectedRoute roles={["Bếp trưởng"]}>
            <RequestMenu />
          </ProtectedRoute>
        }
      />

      {/* 3. Trang Lễ tân (Receptionist) */}
      <Route
        path="/reception"
        element={
          <ProtectedRoute roles={["Lễ tân"]}>
            <ReceptionDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reception/payment"
        element={
          <ProtectedRoute roles={["Lễ tân"]}>
            <PaymentSelection />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reception/payment/:tableId"
        element={
          <ProtectedRoute roles={["Lễ tân"]}>
            <PaymentPage />
          </ProtectedRoute>
        }
      />

      {/* 4. Trang Kho (Storage) */}
      <Route
        path="/storage"
        element={
          <ProtectedRoute roles={["Quản lý kho"]}>
            <StorageDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/storage/history"
        element={
          <ProtectedRoute roles={["Quản lý kho"]}>
            <StorageHistory />
          </ProtectedRoute>
        }
      />

      {/* 5. Trang Quản lý (Manager) */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute roles={["Quản lý"]}>
            <ManagerHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/employees"
        element={
          <ProtectedRoute roles={["Quản lý"]}>
            <ManageEmployees />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/menu"
        element={
          <ProtectedRoute roles={["Quản lý"]}>
            <ManageMenu />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/requests"
        element={
          <ProtectedRoute roles={["Quản lý"]}>
            <ManagerMenuRequests />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/reports"
        element={
          <ProtectedRoute roles={["Quản lý"]}>
            <ManagerReports />
          </ProtectedRoute>
        }
      />

      {/* --------------------------------------------------------------------- */}

      {/* Fallback: Route không tồn tại -> Chuyển hướng về trang lỗi */}
      <Route path="*" element={<Navigate to="/error" />} />
    </Routes>
  );
}
