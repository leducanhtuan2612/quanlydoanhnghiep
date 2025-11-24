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
import { useSettings } from "../context/SettingsContext";

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
  { name: "Cài đặt", icon: Cog, to: "/settings", roles: ["admin"] },
];

export default function Sidebar() {
  const role = localStorage.getItem("role") || "user";
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { settings } = useSettings();

  // 🔥 Chỉ sửa danh sách menu Nhân viên
  if (user.role === "employee" && user.employee_id) {
    const index = MENUS.findIndex((m) => m.name === "Nhân viên");
    if (index !== -1) {
      MENUS[index].to = `/employees/profile/${user.employee_id}`;
    }
  }

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
    </aside>
  );
}
