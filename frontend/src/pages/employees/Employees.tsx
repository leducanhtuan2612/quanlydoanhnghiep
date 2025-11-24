import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, X, Check, Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

// =======================================================
// TYPES
// =======================================================
type Department = "Kinh doanh" | "Kế toán" | "Kho" | "Marketing";

type Employee = {
  id?: number;
  name: string;
  email: string;
  department: Department;
  active: boolean;
  avatar?: string | null;

  phone?: string;
  gender?: string;
  birthday?: string;
  position?: string;
  start_date?: string;
  address?: string;
  notes?: string;
  citizen_id?: string;
};

// =======================================================
// API URL
// =======================================================
const API_URL = "http://127.0.0.1:8000/employees";

// =======================================================
// MAIN COMPONENT
// =======================================================
export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState<"" | Department>("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const navigate = useNavigate();

  // User login info
const user = JSON.parse(localStorage.getItem("user") || "{}");

// ============================
// ⭐ KIỂM TRA QUYỀN NHÂN VIÊN
// ============================
useEffect(() => {
  if (user.role === "employee") {
    // ❗ Chưa gắn employee_id → KHÔNG redirect
    if (!user.employee_id) return;

    // ✔ Có employee_id → điều hướng vào hồ sơ
    navigate(`/employees/profile/${user.employee_id}`);
  }
}, [user, navigate]);

/// Nếu là nhân viên
if (user.role === "employee") {

  // Chưa gắn employee_id → chỉ hiện thông báo
  if (!user.employee_id) {
    return (
      <div className="p-6 text-center text-red-600 font-medium">
        ❗ Tài khoản của bạn chưa được gắn vào hồ sơ nhân viên.
        <br />Vui lòng liên hệ quản trị viên.
      </div>
    );
  }

  // Có employee_id → chuyển đến hồ sơ
  navigate(`/employees/profile/${user.employee_id}`);
  return (
    <div className="p-6 text-center text-slate-600">
      ⏳ Đang chuyển hướng đến hồ sơ của bạn...
    </div>
  );
}




  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (err) {
      console.error(err);
      setEmployees([]);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter employees
  const filtered = useMemo(() => {
    return employees
      .filter((e) => (department ? e.department === department : true))
      .filter((e) => {
        const q = query.trim().toLowerCase();
        return (
          !q ||
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q)
        );
      });
  }, [employees, query, department]);

  // Toggle Active
  const toggleActive = async (id: number) => {
    const emp = employees.find((e) => e.id === id);
    if (!emp) return;

    const updated = { ...emp, active: !emp.active };

    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });

    fetchEmployees();
  };

  // Save employee (Create / Update)
  const saveEmployee = async (emp: any, id?: number) => {
    const isEdit = Boolean(id);
    const avatarFile = emp.avatarFile;
    delete emp.avatarFile;

    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `${API_URL}/${id}` : API_URL;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emp),
    });

    const saved = await res.json();

    // Upload avatar nếu có
    if (avatarFile && saved.id) {
      const fd = new FormData();
      fd.append("file", avatarFile);

      await fetch(`${API_URL}/upload-avatar/${saved.id}`, {
        method: "POST",
        body: fd,
      });
    }

    fetchEmployees();
    setOpen(false);
    setEditing(null);
  };

  // Delete
  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa nhân viên này?")) return;
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchEmployees();
  };

  // =======================================================
  // RENDER
  // =======================================================
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Quản lý Nhân viên</h1>

      {/* Toolbar */}
      <div className="bg-white border rounded-xl p-3 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="pl-8 pr-3 py-2 border rounded-lg"
            placeholder="Tìm theo tên hoặc email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value as Department)}
          className="py-2 px-3 border rounded-lg"
        >
          <option value="">Tất cả phòng ban</option>
          <option value="Kinh doanh">Kinh doanh</option>
          <option value="Kế toán">Kế toán</option>
          <option value="Kho">Kho</option>
          <option value="Marketing">Marketing</option>
        </select>

        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="ml-auto inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg"
        >
          <Plus size={18} /> Nhân viên mới
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left">Nhân viên</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Phòng ban</th>
              <th className="px-4 py-2 text-left">Trạng thái</th>
              <th className="px-4 py-2 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-t">
                <td
                  className="px-4 py-2 flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate(`/employees/profile/${e.id}`)}
                >
                  <User className="w-10 h-10 p-2 bg-slate-100 rounded-full text-slate-500" />

                  <span className="font-medium text-blue-600 hover:underline">
                    {e.name}
                  </span>
                </td>

                <td className="px-4 py-2">{e.email}</td>
                <td className="px-4 py-2">{e.department}</td>

                <td className="px-4 py-2">
                  <button
                    onClick={() => toggleActive(e.id!)}
                    className={`px-2 py-1 rounded-full text-xs ${
                      e.active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {e.active ? "Đang làm việc" : "Tạm nghỉ"}
                  </button>
                </td>
<td className="px-4 py-2 text-right flex justify-end gap-2">

  {/* ⭐ Chỉ Admin mới được tạo tài khoản */}
  {user.role === "admin" && (
    <button
      onClick={() => navigate(`/admin/create-account/${e.id}`)}
      className="px-2 py-1 rounded-lg border border-green-600 text-green-700 hover:bg-green-50 flex items-center gap-1"
    >
      <Plus size={16} /> Tạo TK
    </button>
  )}

  <button
    onClick={() => {
      setEditing(e);
      setOpen(true);
    }}
    className="px-2 py-1 rounded-lg border hover:bg-slate-50 flex items-center gap-1"
  >
    <Pencil size={16} /> Sửa
  </button>

  <button
    onClick={() => handleDelete(e.id!)}
    className="px-2 py-1 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 flex items-center gap-1"
  >
    <X size={16} /> Xóa
  </button>
</td>

              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-6 text-slate-500">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <EmployeeModal
          initial={
            editing ?? {
              name: "",
              email: "",
              department: "Kinh doanh",
              active: true,
            }
          }
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSave={(data) => saveEmployee(data, editing?.id)}
        />
      )}
    </div>
  );
}

// =======================================================
// MODAL COMPONENT
// =======================================================
function EmployeeModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Employee;
  onClose: () => void;
  onSave: (u: any) => void;
}) {
  const [form, setForm] = useState<any>(initial);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl p-4 space-y-4">
        
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-semibold">
            {initial.id ? "Sửa nhân viên" : "Nhân viên mới"}
          </h3>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 flex flex-col items-center">
            <img
              src={
                avatarFile
                  ? URL.createObjectURL(avatarFile)
                  : form.avatar || "https://ui-avatars.com/api/?name=NV"
              }
              className="w-28 h-28 rounded-full border object-cover mb-2"
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files![0])}
              className="text-sm"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Input label="Họ tên" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />

            <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />

            <Input label="Số điện thoại" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Giới tính"
                value={form.gender}
                onChange={(v) => setForm({ ...form, gender: v })}
                options={["Nam", "Nữ", "Khác"]}
              />

              <Input
                type="date"
                label="Ngày sinh"
                value={form.birthday}
                onChange={(v) => setForm({ ...form, birthday: v })}
              />
            </div>

            <Input
              label="CCCD / CMND"
              value={form.citizen_id}
              onChange={(v) => setForm({ ...form, citizen_id: v })}
            />

            <Input label="Địa chỉ" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />

            <Input label="Chức vụ" value={form.position} onChange={(v) => setForm({ ...form, position: v })} />

            <Input
              type="date"
              label="Ngày bắt đầu làm việc"
              value={form.start_date}
              onChange={(v) => setForm({ ...form, start_date: v })}
            />

            <Select
              label="Phòng ban"
              value={form.department}
              onChange={(v) => setForm({ ...form, department: v })}
              options={["Kinh doanh", "Kế toán", "Kho", "Marketing"]}
            />

            <textarea
              placeholder="Ghi chú"
              className="border rounded-lg w-full px-3 py-2"
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Đang làm việc
            </label>
          </div>
        </div>

        <div className="border-t pt-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border">
            Hủy
          </button>

          <button
            onClick={() => onSave({ ...form, avatarFile })}
            className="px-3 py-2 rounded-lg bg-blue-600 text-white flex items-center gap-2"
          >
            <Check size={16} /> Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

// =======================================================
// REUSABLE INPUT COMPONENTS
// =======================================================
function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        className="w-full border rounded-lg px-3 py-2"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-sm text-slate-600 mb-1">{label}</label>
      <select
        className="w-full border rounded-lg px-3 py-2"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o, i) => (
          <option key={i}>{o}</option>
        ))}
      </select>
    </div>
  );
}
