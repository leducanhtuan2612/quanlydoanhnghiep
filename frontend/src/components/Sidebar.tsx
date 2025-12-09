// frontend/src/components/Sidebar.tsx
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserRound,
  Package,
  Boxes,
  FileBarChart2,
  Settings as Cog,
  Shield,
  ClipboardList,
  Info,
} from "lucide-react";
import clsx from "clsx";
import { useSettings } from "../context/SettingsContext";
import { useState } from "react";

export default function Sidebar() {
  const role = localStorage.getItem("role") || "employee";
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { settings } = useSettings();
  const navigate = useNavigate();

  const hasEmployeeProfile = Boolean(user?.employee_id);
  const [tooltip, setTooltip] = useState("");

  // ==========================================
  // ⭐ MENU CHO EMPLOYEE (FULL QUYỀN)
  // ==========================================
  const EMPLOYEE_FULL = [
    {
      name: "Trang chủ",
      icon: LayoutDashboard,
      to: hasEmployeeProfile ? "/employee/home" : "/employee/home/unassigned",
      disabled: false,
    },

    {
      name: "Hồ sơ của tôi",
      icon: Users,
      to: `/employees/profile/${user?.employee_id || 0}`,
      disabled: !hasEmployeeProfile,
    },

    { name: "Khách hàng", icon: UserRound, to: "/customers", disabled: false },
    { name: "Đơn hàng", icon: Package, to: "/orders", disabled: false },
    { name: "Sản phẩm", icon: Package, to: "/employee/products", disabled: false },
    { name: "Kho hàng", icon: Boxes, to: "/inventory", disabled: false },

    {
      name: "Công việc",
      icon: ClipboardList,
      to: "/employee/tasks",
      disabled: !hasEmployeeProfile,
    },
  ];

  // ==========================================
  // ⭐ MENU ADMIN
  // ==========================================
  const ADMIN_MENUS = [
    { name: "Trang chủ", icon: LayoutDashboard, to: "/" },
    { name: "Đơn hàng", icon: Package, to: "/orders" },
    { name: "Nhân viên", icon: Users, to: "/employees" },
    { name: "Quản lý nhân viên", icon: Users, to: "/employee-management/attendance" },
    { name: "Khách hàng", icon: UserRound, to: "/customers" },
    { name: "Sản phẩm", icon: Package, to: "/products" },
    { name: "Kho hàng", icon: Boxes, to: "/inventory" },
    { name: "Công việc", icon: ClipboardList, to: "/admin/tasks" },
    { name: "Báo cáo", icon: FileBarChart2, to: "/reports" },
    { name: "Admin", icon: Shield, to: "/admin/users" },
    { name: "Phân quyền", icon: Shield, to: "/admin/roles" },
    { name: "Cài đặt", icon: Cog, to: "/settings" },
  ];

  // ==========================================
  // ⭐ MENU MANAGER
  // ==========================================
  const MANAGER_MENUS = [
    { name: "Trang chủ", icon: LayoutDashboard, to: "/manager/home" },
    { name: "Nhân viên", icon: Users, to: "/employees" },
    { name: "Quản lý nhân viên", icon: Users, to: "/employee-management/attendance" },
    { name: "Khách hàng", icon: UserRound, to: "/customers" },
    { name: "Đơn hàng", icon: Package, to: "/orders" },
    { name: "Sản phẩm", icon: Package, to: "/products" },
    { name: "Kho hàng", icon: Boxes, to: "/inventory" },
    { name: "Công việc", icon: ClipboardList, to: "/admin/tasks" },
    { name: "Báo cáo", icon: FileBarChart2, to: "/reports" },
  ];

  // ==========================================
  // ⭐ CHỌN MENU THEO ROLE
  // ==========================================
  let MENUS: any[] = [];

  if (role === "admin") MENUS = ADMIN_MENUS;
  else if (role === "manager") MENUS = MANAGER_MENUS;
  else MENUS = EMPLOYEE_FULL;

  return (
    <aside
      className="w-66 text-white flex flex-col h-screen shadow-lg transition-all"
      style={{ background: settings?.theme_color || "var(--theme-color)" }}
    >
      {/* LOGO */}
      <div className="px-5 h-27 flex items-center gap-2 text-lg font-semibold">
        <div className="w-8 h-8 flex items-center ">
      
        </div>
      </div>

      {/* MENU */}
     <nav className="p-5 space-y-4 flex-1 overflow-y-auto no-scrollbar">

        {MENUS.map((m) => {
          const Icon = m.icon;

          // Disable nếu employee chưa có employee_id (trừ trang chủ)
          const isDisabled =
            !hasEmployeeProfile && role === "employee" && m.name !== "Trang chủ";

          return (
            <div
              key={m.name}
              className="relative group"
              onMouseEnter={() => {
                if (isDisabled) setTooltip("Tài khoản chưa được gắn với hồ sơ nhân viên");
              }}
              onMouseLeave={() => setTooltip("")}
            >
              <button
                className={clsx(
                  "w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-colors",
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-white/10 text-white/90 hover:text-white"
                )}
                onClick={() => {
                  if (!isDisabled) navigate(m.to);
                }}
              >
                <Icon size={20} />
                <span className="text-sm">{m.name}</span>

                {isDisabled && <Info size={14} className="ml-auto" />}
              </button>

              {/* Tooltip */}
              {isDisabled && tooltip && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-black text-white text-xs px-3 py-1 rounded shadow-lg whitespace-nowrap">
                  {tooltip}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="mt-auto px-4 py-3 border-t border-white/10 text-center">
        <p className="text-[11px] text-white/60 leading-tight">
          © {new Date().getFullYear()}
          <br />
          {settings?.company_name || "ERP System"}
        </p>
      </div>
    </aside>
  );
}
