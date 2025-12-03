import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

// Layout
import App from "./App";

// MAIN PAGES
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

// EMPLOYEE
import Employees from "./pages/employees/Employees";
import EmployeeProfile from "./pages/employees/EmployeeProfile";
import EmployeeSalary from "./pages/employees/EmployeeSalary";
import EmployeeBenefits from "./pages/employees/EmployeeBenefits";
import EmployeeContract from "./pages/employees/EmployeeContract";
import EmployeeHome from "./pages/employees/EmployeeHome";
import CreateEmployeeAccount from "./pages/employees/CreateEmployeeAccount";

// EMPLOYEE TASKS
import EmployeeTaskList from "./pages/employees/tasks/EmployeeTaskList";
import EmployeeTaskDetail from "./pages/employees/tasks/EmployeeTaskDetail";
// EMPLOYEE PRODUCT PAGE
// EMPLOYEE PRODUCT PAGE
import EmployeeProducts from "./pages/employees/products/EmployeeProducts";



// ADMIN TASKS
import AdminTaskList from "./pages/tasks/TaskList";
import AdminTaskDetail from "./pages/tasks/TaskDetail";

// ADMIN MANAGEMENT
import EmployeeManagementLayout from "./pages/employeeManagement/EmployeeManagementLayout";
import ManageAttendance from "./pages/employeeManagement/ManageAttendance";
import ManageSalary from "./pages/employeeManagement/ManageSalary";
import ManageBenefits from "./pages/employeeManagement/ManageBenefits";
import ManageContracts from "./pages/employeeManagement/ManageContracts";

// OTHER MODULES
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
import AdminUsers from "./pages/admin/Users";
import Roles from "./pages/admin/Roles";
import AdminBenefitsPage from "./pages/admin/benefits/AdminBenefitsPage";

// SETTINGS CONTEXT
import { SettingsProvider } from "./context/SettingsContext";


// -------------------------------------------------------
// ROUTER CONFIG
// -------------------------------------------------------

const router = createBrowserRouter([
  // login / register
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },

  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },

      // ORDERS
      { path: "orders", element: <OrdersPage /> },
      { path: "orders/new", element: <CreateOrder /> },

      // EMPLOYEE PROFILE MODULE
      { path: "employees", element: <Employees /> },
      { path: "employees/profile/:id", element: <EmployeeProfile /> },
      { path: "employees/salary/:id", element: <EmployeeSalary /> },
      { path: "employees/:id/benefits", element: <EmployeeBenefits /> },
      { path: "employees/:id/contracts", element: <EmployeeContract /> },

      // Attendance
      { path: "attendance/:id", element: <AttendancePage /> },

      // Create employee account
      { path: "admin/create-account/:id", element: <CreateEmployeeAccount /> },

      // EMPLOYEE HOME
      { path: "employee/home", element: <EmployeeHome /> },
      { path: "employee/products", element: <EmployeeProducts /> },

      // -----------------------------------------------------
      // ADMIN TASK MANAGEMENT
      // -----------------------------------------------------
      { path: "admin/tasks", element: <AdminTaskList /> },
      { path: "admin/tasks/:id", element: <AdminTaskDetail /> },

      // -----------------------------------------------------
      // EMPLOYEE TASK WORKSPACE
      // -----------------------------------------------------
      { path: "employee/tasks", element: <EmployeeTaskList /> },
      { path: "employee/tasks/:id", element: <EmployeeTaskDetail /> },

      // ADMIN MANAGEMENT (attendance / salary / benefits / contracts)
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

      // BENEFITS ADMIN
      { path: "admin/benefits/:employeeId", element: <AdminBenefitsPage /> },

      // CRM AND BUSINESS
      { path: "customers", element: <Customers /> },
      { path: "products", element: <Products /> },
      { path: "inventory", element: <Inventory /> },
      { path: "reports", element: <Reports /> },
      { path: "revenue", element: <Revenue /> },
      { path: "crm", element: <CRMPage /> },

      // SYSTEM SETTINGS
      { path: "settings", element: <Settings /> },
      { path: "admin/users", element: <AdminUsers /> },
      { path: "admin/roles", element: <Roles /> },
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
