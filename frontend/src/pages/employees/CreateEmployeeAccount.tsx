import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:8000";

export default function CreateEmployeeAccount() {
  const { id } = useParams(); // employee_id
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🔥 Lấy thông tin nhân viên theo ID
  const fetchEmployee = async () => {
    try {
      const res = await fetch(`${API}/employees/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setError("Không tìm thấy nhân viên");
        return;
      }

      setEmployee(data);

      // Gợi ý username/email
      setEmail(data.email || "");
      setUsername(data.name?.toLowerCase().replace(/\s+/g, "") || "");
    } catch (err) {
      setError("Lỗi tải dữ liệu");
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, []);

  // ⭐ Nếu employee chưa load xong → tránh lỗi undefined
  if (!employee) {
    return (
      <div className="p-6 text-center text-slate-600">
        ⏳ Đang tải dữ liệu nhân viên...
      </div>
    );
  }

  const handleCreate = async () => {
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: employee.name,
          username,
          email,
          password,
          role,
          employee_id: employee.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Lỗi tạo tài khoản");
        return;
      }

      setSuccess("Tạo tài khoản thành công!");
      setTimeout(() => navigate("/employees"), 1200);

    } catch (err) {
      setError("Không thể kết nối server");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold">
        Tạo tài khoản cho nhân viên:{" "}
        <span className="text-blue-600">{employee.name}</span>
      </h2>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}

      <div className="space-y-2">
        <label className="text-sm">Tên đăng nhập</label>
        <input
          className="w-full border px-3 py-2 rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label className="text-sm">Email</label>
        <input
          className="w-full border px-3 py-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="text-sm">Mật khẩu</label>
        <input
          className="w-full border px-3 py-2 rounded"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="text-sm">Quyền</label>
        <select
          className="w-full border px-3 py-2 rounded"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="employee">Nhân viên</option>
          <option value="manager">Quản lý</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        onClick={handleCreate}
      >
        Tạo tài khoản
      </button>
    </div>
  );
}
