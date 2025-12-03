// frontend/src/components/Sidebar.tsx
import { NavLink } from "react-router-dom";
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
} from "lucide-react";
import clsx from "clsx";
import { useSettings } from "../context/SettingsContext";

export default function Sidebar() {
  const role = localStorage.getItem("role") || "employee";
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { settings } = useSettings();

  // ============================
  // 👉 MENU DÀNH CHO ADMIN
  // ============================
  const ADMIN_MENUS = [
    { name: "Trang chủ", icon: LayoutDashboard, to: "/" },
    { name: "Đơn hàng", icon: Package, to: "/orders" },
    { name: "Nhân viên", icon: Users, to: "/employees" },
    { name: "Quản lý nhân viên", icon: Users, to: "/employee-management/attendance" },
    { name: "Khách hàng", icon: UserRound, to: "/customers" },
    { name: "Quản lý Sản phẩm", icon: Package, to: "/products" },
    { name: "Kho hàng", icon: Boxes, to: "/inventory" },

    // ⭐ QUẢN LÝ CÔNG VIỆC (ADMIN)
    { name: "Công việc", icon: ClipboardList, to: "/admin/tasks" },

    { name: "Báo cáo", icon: FileBarChart2, to: "/reports" },
    { name: "Admin", icon: Shield, to: "/admin/users" },
    { name: "Phân quyền", icon: Shield, to: "/admin/roles" },
    { name: "Cài đặt", icon: Cog, to: "/settings" },
  ];

  // ============================
  // 👉 MENU DÀNH CHO NHÂN VIÊN
  // ============================
 const EMPLOYEE_MENUS = [
  // ⭐ Hồ sơ cá nhân lên đầu
 

  { name: "Trang chủ", icon: LayoutDashboard, to: "/employee/home" },
   user?.employee_id && {
    name: "Hồ sơ của tôi",
    icon: Users,
    to: `/employees/profile/${user.employee_id}`,
  },
  { name: "Khách hàng", icon: UserRound, to: "/customers" },
  { name: "Đơn hàng", icon: Package, to: "/orders" },
{ name: "Sản phẩm", icon: Package, to: "/employee/products" },

  { name: "Kho hàng", icon: Boxes, to: "/inventory" },
  { name: "Công việc", icon: ClipboardList, to: "/employee/tasks" },
].filter(Boolean);
  // ============================
  // 👉 CHỌN MENU THEO ROLE
  // ============================
  const MENUS = role === "admin" ? ADMIN_MENUS : EMPLOYEE_MENUS;

  return (
    <aside
      className="w-66 text-white flex flex-col h-screen shadow-lg transition-all"
      style={{ background: settings?.theme_color || "var(--theme-color)" }}
    >
      <div className="px-5 h-27 flex items-center gap-2 text-lg font-semibold">
        {settings?.logo_url ? (
          <img />
        ) : (
          <div className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full text-xs font-bold">
            {settings?.company_name?.[0]?.toUpperCase() || "L"}
          </div>
        )}
      </div>

      <nav className="p-5 space-y-4 flex-1 overflow-y-auto">
        {MENUS.map((m) => {
          const Icon = m.icon;
          return (
            <NavLink
              key={m.name}
              to={m.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-xl transition-colors",
                  isActive
                    ? "bg-white/25 font-medium"
                    : "hover:bg-white/10 text-white/90 hover:text-white"
                )
              }
            >
              <Icon size={20} />
              <span className="text-sm">{m.name}</span>
            </NavLink>
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
