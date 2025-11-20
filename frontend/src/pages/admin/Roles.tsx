import { useEffect, useState } from "react";
import { Shield, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Admin = {
  id: number;
  username: string;
  full_name?: string;
  email?: string;
  role: string;
  is_active: boolean;
};

const API = "http://127.0.0.1:8000";

export default function Roles() {
  const [users, setUsers] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 🟢 Lấy danh sách người dùng
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`${API}/admins`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (r.status === 401) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          localStorage.removeItem("token");
          setTimeout(() => navigate("/login"), 1500);
          return [];
        }
        if (r.status === 403) {
          setError("Bạn không có quyền truy cập trang này.");
          return [];
        }
        if (!r.ok) {
          setError(`Lỗi: ${r.statusText}`);
          return [];
        }
        return r.json();
      })
      .then((data) => Array.isArray(data) && setUsers(data))
      .catch(() => setError("Không thể kết nối đến máy chủ."))
      .finally(() => setLoading(false));
  }, [navigate]);

  // 🟡 Cập nhật quyền người dùng
  const updateRole = async (id: number, role: string) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/admins/${id}/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });

    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    } else if (res.status === 403) {
      alert("Bạn không có quyền thay đổi quyền người dùng này.");
    } else {
      alert("Cập nhật quyền thất bại");
    }
  };

  // 🔵 Khóa / Mở tài khoản
  const toggleActive = async (id: number, is_active: boolean) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/admins/${id}/active`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_active }),
    });

    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, is_active } : u
        )
      );
    } else if (res.status === 403) {
      alert("Bạn không có quyền cập nhật trạng thái người dùng này.");
    } else {
      alert("Cập nhật trạng thái thất bại");
    }
  };

  if (loading) return <p>Đang tải danh sách người dùng...</p>;
  if (error) return <p className="text-red-600 font-medium">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <Shield size={22} /> Quản lý phân quyền
      </h1>

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2">Tên đăng nhập</th>
              <th className="text-left px-4 py-2">Họ tên</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Quyền</th>
              <th className="text-left px-4 py-2">Trạng thái</th>
              <th className="text-right px-4 py-2">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{u.username}</td>
                <td className="px-4 py-2">{u.full_name || "-"}</td>
                <td className="px-4 py-2">{u.email || "-"}</td>

                {/* ROLE */}
                <td className="px-4 py-2">
                  <select
                    value={u.role}
                    onChange={(e) => updateRole(u.id, e.target.value)}
                    className="border rounded-lg px-2 py-1"
                  >
                    <option value="user">Người dùng</option>
                    <option value="manager">Quản lý</option>
                    <option value="admin">Quản trị</option>
                  </select>
                </td>

                {/* ACTIVE */}
                <td className="px-4 py-2">
                  {u.is_active ? (
                    <span className="text-green-600 font-medium">Hoạt động</span>
                  ) : (
                    <span className="text-red-600 font-medium">Khóa</span>
                  )}
                </td>

                {/* ACTION */}
                <td className="px-4 py-2 text-right space-x-2">
                  {u.is_active ? (
                    <button
                      onClick={() => toggleActive(u.id, false)}
                      className="px-3 py-1 rounded-lg border text-red-600 hover:bg-red-50 flex items-center gap-1"
                    >
                      <X size={14} /> Khóa
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleActive(u.id, true)}
                      className="px-3 py-1 rounded-lg border text-green-600 hover:bg-green-50 flex items-center gap-1"
                    >
                      <Check size={14} /> Mở
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-center text-slate-500 py-4 italic"
                >
                  Chưa có người dùng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
