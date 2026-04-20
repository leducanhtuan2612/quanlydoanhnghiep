import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

const API = "http://127.0.0.1:8000";

export default function CreateEmployeeAccount() {
  const { id } = useParams(); // employee_id
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================================
  // 🔥 Lấy thông tin nhân viên
  // ==========================================================
  const fetchEmployee = async () => {
    try {
      const res = await fetch(`${API}/employees/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setError("Không tìm thấy nhân viên");
        setLoading(false);
        return;
      }

      setEmployee(data);

      // Gợi ý username + email
      setUsername(
        (data.name || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "")
      );
      setEmail(data.email || "");

      setLoading(false);
    } catch {
      setError("Không thể tải dữ liệu nhân viên");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, []);

  // ==========================================================
  // 🎯 Tạo tài khoản
  // ==========================================================
  const handleCreate = async () => {
    setError("");
    setSuccess("");

    if (!username.trim()) return setError("Tên đăng nhập không được để trống");
    if (!password.trim()) return setError("Mật khẩu không được để trống");

    try {
      const payload = {
        full_name: employee.name,
        username,
        email: email.trim() || null,
        password,
        role,
        employee_id: role === "employee" ? employee.id : null,
      };

      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Không thể tạo tài khoản");
        return;
      }

      setSuccess("🎉 Tạo tài khoản thành công");
      setTimeout(() => navigate("/employees"), 1500);
    } catch {
      setError("Không thể kết nối tới server");
    }
  };

  // ==========================================================
  // UI
  // ==========================================================
  if (loading) {
    return (
      <div className="p-6 text-center text-slate-600">
        ⏳ Đang tải thông tin nhân viên...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6 text-center text-red-600">
        ❌ Không thể tải thông tin nhân viên
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500">
        <Link to="/employees" className="text-blue-600 hover:underline">
          Nhân viên
        </Link>{" "}
        / Tạo tài khoản
      </div>

      {/* Header */}
      <h2 className="text-2xl font-semibold">
        👤 Tạo tài khoản đăng nhập cho nhân viên
      </h2>

      {/* Card thông tin nhân viên */}
      <div className="bg-white rounded-xl shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-slate-500">Họ tên</p>
          <p className="font-medium">{employee.name}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Mã nhân viên</p>
          <p className="font-medium">{employee.id}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Email</p>
          <p className="font-medium">{employee.email || "—"}</p>
        </div>
      </div>

      {/* Form tạo tài khoản */}
      <div className="bg-white rounded-xl shadow p-6 max-w-2xl space-y-4">
        <h3 className="text-lg font-semibold">
          Thông tin tài khoản hệ thống
        </h3>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Tên đăng nhập
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-200"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Email (không bắt buộc)
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Quyền tài khoản
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-200"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="employee">Nhân viên</option>
              <option value="manager">Quản lý</option>
              <option value="admin">Quản trị hệ thống</option>
            </select>

            {role !== "employee" && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠ Tài khoản không phải nhân viên sẽ không liên kết hồ sơ nhân sự
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Tạo tài khoản
          </button>

          <button
            onClick={() => navigate("/employees")}
            className="border px-6 py-2 rounded-lg hover:bg-slate-100"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
