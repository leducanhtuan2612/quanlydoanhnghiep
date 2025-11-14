import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

// Layout
import App from "./App";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

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
// Context
import { SettingsProvider } from "./context/SettingsContext";
import EmployeeBenefits from "./pages/employees/EmployeeBenefits";
import BenefitsPage from "./pages/benefits/BenefitsPage";
// -----------------------
// ROUTER CONFIG
// -----------------------
const router = createBrowserRouter([
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
   { path: "employees/:id/benefits", element: <EmployeeBenefits />},
   {  path: "benefits/:id", element: <BenefitsPage />},
      // ADMIN
      { path: "admin/users", element: <AdminUsers /> },
      { path: "admin/roles", element: <Roles /> },
      { path:"/admin/benefits", element: <AdminBenefitsPage />},
      // CRM / BUSINESS
      { path: "customers", element: <Customers /> },
      { path: "products", element: <Products /> },
      { path: "inventory", element: <Inventory /> },
      { path: "reports", element: <Reports /> },
      { path: "revenue", element: <Revenue /> },
      { path: "crm", element: <CRMPage /> },

      // SETTINGS
      { path: "settings", element: <Settings /> },
     
    ],
  },

  // LOGIN PAGE
  {
    path: "/login",
    element: <Login />,
  },
]);

// -----------------------
// APP RENDER
// -----------------------
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SettingsProvider>
      <RouterProvider router={router} />
    </SettingsProvider>
  </React.StrictMode>
);
