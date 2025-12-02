import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

// Layout
import App from "./App";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Employees from "./pages/employees/Employees";
import EmployeeProfile from "./pages/employees/EmployeeProfile";

import AdminUsers from "./pages/admin/Users";
import Roles from "./pages/admin/Roles";

import Customers from "./pages/customers/Customers";
import Products from "./pages/products/Products";
import Inventory from "./pages/inventory/Inventory";
import Reports from "./pages/reports/Reports";
import OrdersPage from "./pages/OrdersPage";
import CreateOrder from "./pages/CreateOrder";
import Revenue from "./pages/Revenue";
import CRMPage from "./pages/CRM";
import Settings from "./pages/settings/Settings";
import AttendancePage from "./pages/attendance/Attendance";
import AdminBenefitsPage from "./pages/admin/benefits/AdminBenefitsPage";

import { SettingsProvider } from "./context/SettingsContext";
import EmployeeBenefits from "./pages/employees/EmployeeBenefits";
import BenefitsPage from "./pages/benefits/BenefitsPage";
import EmployeeSalary from "./pages/employees/EmployeeSalary";
import EmployeeContract from "./pages/employees/EmployeeContract";
import CreateEmployeeAccount from "./pages/employees/CreateEmployeeAccount";
// Quản lý nhân viên (Admin)
import EmployeeManagementLayout from "./pages/employeeManagement/EmployeeManagementLayout";
import ManageAttendance from "./pages/employeeManagement/ManageAttendance";
import ManageSalary from "./pages/employeeManagement/ManageSalary";
import ManageBenefits from "./pages/employeeManagement/ManageBenefits";
import ManageContracts from "./pages/employeeManagement/ManageContracts";




// -------------------------------------------------------
// ROUTER CONFIG
// -------------------------------------------------------
const router = createBrowserRouter([
  // 👉 LOGIN & REGISTER KHÔNG DÙNG LAYOUT — đứng độc lập
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },

  // 👉 Tất cả trang khác dùng Layout App
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },

      { path: "orders", element: <OrdersPage /> },
      { path: "orders/new", element: <CreateOrder /> },

      // EMPLOYEES
      { path: "employees", element: <Employees /> },
      { path: "employees/profile/:id", element: <EmployeeProfile /> },
      { path: "attendance/:id", element: <AttendancePage /> },
      { path: "employees/:id/benefits", element: <EmployeeBenefits /> },
      { path: "employees/:id", element: <EmployeeProfile /> }, 
      { path: "employees/salary/:id", element: <EmployeeSalary /> },
      { path: "admin/create-account/:id", element: <CreateEmployeeAccount /> },

 // 👉 Route mới cho HỢP ĐỒNG
    { path: "employees/:id/contracts", element: <EmployeeContract /> },

      // BENEFITS
      { path: "benefits/:id", element: <BenefitsPage /> },

      // ADMIN
      { path: "admin/users", element: <AdminUsers /> },
      { path: "admin/roles", element: <Roles /> },
     { path: "admin/benefits/:employeeId", element: <AdminBenefitsPage /> },


      // CRM / BUSINESS
      { path: "customers", element: <Customers /> },
      { path: "products", element: <Products /> },
      { path: "inventory", element: <Inventory /> },
      { path: "reports", element: <Reports /> },
      { path: "revenue", element: <Revenue /> },
      { path: "crm", element: <CRMPage /> },

      // SETTINGS
      { path: "settings", element: <Settings /> },
// -----------------------------------------------------
// ⭐ QUẢN LÝ NHÂN VIÊN — ADMIN PAGE (tất cả nhân viên)
// -----------------------------------------------------
{
  path: "employee-management",
  element: <EmployeeManagementLayout />,
  children: [
    { path: "attendance", element: <ManageAttendance /> },
    { path: "salary", element: <ManageSalary /> },
    { path: "benefits", element: <ManageBenefits /> },
    { path: "contracts", element: <ManageContracts /> },
  ],
},

     
    ],
  },
]);

// -------------------------------------------------------
// RENDER APP
// -------------------------------------------------------
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SettingsProvider>
      <RouterProvider router={router} />
    </SettingsProvider>
  </React.StrictMode>
);
