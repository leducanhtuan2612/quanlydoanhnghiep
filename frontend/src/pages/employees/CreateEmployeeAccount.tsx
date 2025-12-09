import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
    } catch (err) {
      setError("Không thể tải dữ liệu");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, []);

  // ==========================================================
  // 🕒 Loading UI
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
        ❌ Lỗi: Không thể tải thông tin nhân viên.
      </div>
    );
  }

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

      setSuccess("🎉 Tạo tài khoản thành công!");
      setTimeout(() => navigate("/employees"), 1200);
    } catch (err) {
      setError("Không thể kết nối server");
    }
  };

  // ==========================================================
  // UI
  // ==========================================================
  return (
    <div className="p-6 max-w-xl mx-auto space-y-4 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold">
        Tạo tài khoản cho nhân viên:{" "}
        <span className="text-blue-600">{employee.name}</span>
      </h2>

      {error && <p className="text-red-600 font-medium">{error}</p>}
      {success && <p className="text-green-600 font-medium">{success}</p>}

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Tên đăng nhập</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Không bắt buộc"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Mật khẩu</label>
          <input
            className="w-full border px-3 py-2 rounded"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Quyền tài khoản</label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="employee">Nhân viên</option>
            <option value="manager">Quản lý</option>
            <option value="admin">Admin</option>
          </select>

          {/* Giải thích thêm cho rõ */}
          {role !== "employee" && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠ Tài khoản không phải nhân viên sẽ không được gán employee_id.
            </p>
          )}
        </div>
      </div>

      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-lg w-full text-center"
        onClick={handleCreate}
      >
        Tạo tài khoản
      </button>
    </div>
  );
}
