import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

type User = {
  id: number;
  username: string;
  full_name?: string;
  email?: string;
  is_active: boolean;
  password?: string;
  role?: string;
};

const API = "http://127.0.0.1:8000";

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // =============================
  // GET USERS (ADMIN ONLY)
  // =============================
  useEffect(() => {
    fetch(`${API}/admins`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
        else if (data?.data) setUsers(data.data);
        else setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // =============================
  // SAVE USER (CREATE / UPDATE)
  // =============================
  const saveUser = async (user: Omit<User, "id">, id?: number) => {
    const method = id ? "PUT" : "POST";
    const url = id ? `${API}/admins/${id}` : `${API}/admins`;

    // Nếu EDIT mà không thay mật khẩu → bỏ password khỏi body
    if (id && !user.password) {
      delete user.password;
    }

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(user),
    });

    const data = await res.json();

    if (res.ok) {
      if (id) {
        setUsers((prev) => prev.map((u) => (u.id === id ? data : u)));
      } else {
        setUsers((prev) => [data, ...prev]);
      }
      setOpen(false);
      setEditing(null);
    } else {
      alert(data.detail || "Lỗi khi lưu người dùng");
    }
  };

  // =============================
  // DELETE USER
  // =============================
  const deleteUser = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;

    await fetch(`${API}/admins/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  if (loading) return <p>Đang tải danh sách...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Quản lý người dùng</h1>

      {/* Nút thêm */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} /> Thêm người dùng
        </button>
      </div>

      {/* Bảng */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left">Tên đăng nhập</th>
              <th className="px-4 py-2 text-left">Họ tên</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Quyền</th>
              <th className="px-4 py-2 text-left">Trạng thái</th>
              <th className="px-4 py-2 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{u.username}</td>
                <td className="px-4 py-2">{u.full_name || "-"}</td>
                <td className="px-4 py-2">{u.email || "-"}</td>
                <td className="px-4 py-2 capitalize">{u.role || "—"}</td>

                <td className="px-4 py-2">
                  {u.is_active ? (
                    <span className="text-green-600 font-medium">Hoạt động</span>
                  ) : (
                    <span className="text-red-600 font-medium">Khóa</span>
                  )}
                </td>

                <td className="px-4 py-2 text-right space-x-2">
                  <button
                    onClick={() => {
                      setEditing(u);
                      setOpen(true);
                    }}
                    className="px-2 py-1 border rounded hover:bg-slate-50 inline-flex items-center gap-1"
                  >
                    <Pencil size={14} /> Sửa
                  </button>

                  <button
                    onClick={() => deleteUser(u.id)}
                    className="px-2 py-1 border text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-slate-500 italic">
                  Chưa có người dùng
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <UserModal
          initial={
            editing ?? {
              id: 0,
              username: "",
              full_name: "",
              email: "",
              password: "",
              role: "employee",
              is_active: true,
            }
          }
          onClose={() => setOpen(false)}
          onSave={(form) =>
            saveUser(
              {
                username: form.username,
                full_name: form.full_name,
                email: form.email,
                password: form.password,
                role: form.role,
                is_active: form.is_active,
              },
              editing?.id
            )
          }
        />
      )}
    </div>
  );
}

// =======================================================
// MODAL
// =======================================================
function UserModal({
  initial,
  onClose,
  onSave,
}: {
  initial: User;
  onClose: () => void;
  onSave: (u: User) => void;
}) {
  const [form, setForm] = useState(initial);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <h3 className="font-semibold">
            {initial.id ? "Sửa người dùng" : "Thêm người dùng mới"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* USERNAME */}
          <div>
            <label className="block text-sm mb-1">Tên đăng nhập</label>
            <input
              className="border rounded-lg w-full px-3 py-2"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          {/* FULL NAME + EMAIL */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Họ tên</label>
              <input
                className="border rounded-lg w-full px-3 py-2"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                className="border rounded-lg w-full px-3 py-2"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm mb-1">
              Mật khẩu {initial.id && "(bỏ trống nếu không đổi)"}
            </label>
            <input
              type="password"
              className="border rounded-lg w-full px-3 py-2"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {/* ROLE */}
          <div>
            <label className="block text-sm mb-1">Quyền</label>
            <select
              className="border rounded-lg w-full px-3 py-2"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
          </div>

          {/* ACTIVE */}
          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            <span>Hoạt động</span>
          </div>
        </div>

        <div className="px-4 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 border rounded-lg">
            Hủy
          </button>

          <button
            onClick={() => onSave(form)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Check size={16} /> Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
