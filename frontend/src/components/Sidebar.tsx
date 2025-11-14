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
} from "lucide-react";
import clsx from "clsx";
import { useSettings } from "../context/SettingsContext"; // 🧩 lấy theme + logo

// =============================
// DANH SÁCH MENU
// =============================
const MENUS = [
  { name: "Trang chủ", icon: LayoutDashboard, to: "/" },
  { name: "Đơn hàng", icon: Package, to: "/orders" }, 
  { name: "Nhân viên", icon: Users, to: "/employees" },
  { name: "Khách hàng", icon: UserRound, to: "/customers" },
  { name: "Sản phẩm", icon: Package, to: "/products" },
  { name: "Kho hàng", icon: Boxes, to: "/inventory" },
  { name: "Báo cáo", icon: FileBarChart2, to: "/reports", roles: ["manager", "admin"] },
  { name: "Admin", icon: Shield, to: "/admin/users", roles: ["admin"] },
  { name: "Phân quyền", icon: Shield, to: "/admin/roles", roles: ["admin"] },
  // 👇 Chỉ admin mới thấy Cài đặt
  { name: "Cài đặt", icon: Cog, to: "/settings", roles: ["admin"] },
];

// =============================
// COMPONENT SIDEBAR
// =============================
export default function Sidebar() {
  const role = localStorage.getItem("role") || "user";
  const { settings } = useSettings(); // 🌈 lấy thông tin theme, logo, tên công ty

  return (
    <aside
      className="w-64 text-white flex flex-col h-screen shadow-lg transition-all"
      style={{
        background: settings?.theme_color || "var(--theme-color)",
      }}
    >
      {/* ==== Header sidebar ==== */}
      <div className="px-5 h-14 flex items-center gap-2 text-lg font-semibold border-b border-white/10">
        {settings?.logo_url ? (
          <img
            src={`http://127.0.0.1:8000${settings.logo_url}`}
            alt="Logo"
            className="w-8 h-8 rounded-full bg-white p-[2px] object-cover"
          />
        ) : (
          <div className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full text-xs font-bold">
            {settings?.company_name?.[0]?.toUpperCase() || "L"}
          </div>
        )}
        <span className="truncate">{settings?.company_name || "Quản lý Doanh nghiệp"}</span>
      </div>

      {/* ==== Menu ==== */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {MENUS.filter((m) => !m.roles || m.roles.includes(role)).map((m) => {
          const Icon = m.icon;
          return (
            <NavLink
              key={m.name}
              to={m.to}
              end={m.to === "/"}
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

      {/* ==== Footer nhỏ ==== */}
      <div className="p-3 text-xs text-white/60 border-t border-white/10">
        © {new Date().getFullYear()} {settings?.company_name || "Công ty"}
      </div>
    </aside>
  );
}
