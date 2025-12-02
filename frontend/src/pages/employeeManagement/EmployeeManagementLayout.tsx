import { NavLink, Outlet } from "react-router-dom";

export default function EmployeeManagementLayout() {
  const menus = [
    { name: "Chấm công", to: "/employee-management/attendance" },
    { name: "Tiền lương", to: "/employee-management/salary" },
    { name: "Phúc lợi", to: "/employee-management/benefits" },
    { name: "Hợp đồng", to: "/employee-management/contracts" },
  ];

  return (
    <div className="p-6 w-full">
      <div className="max-w-7xl mx-auto flex gap-6">

        {/* SIDEBAR */}
        <div className="w-64 bg-white shadow-md rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Quản lý nhân viên</h2>

          <div className="space-y-2">
            {menus.map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg text-sm font-medium
                  ${isActive ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`
                }
              >
                {m.name}
              </NavLink>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 bg-white shadow-md rounded-xl p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
