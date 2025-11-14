import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:8000";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Sai tên đăng nhập hoặc mật khẩu");
        return;
      }

      // ✅ Lưu thông tin vào localStorage
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("role", data.role);

      // ✅ Chuyển sang trang Dashboard
      navigate("/");
    } catch (err) {
      setError("Lỗi kết nối tới máy chủ");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-400">
      <form
        onSubmit={handleLogin}
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-8 space-y-6"
      >
        <h1 className="text-2xl font-semibold text-center text-blue-600">
          Đăng nhập hệ thống
        </h1>

        {error && (
          <p className="text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-sm">
            {error}
          </p>
        )}

        <div>
          <label className="block text-sm text-slate-600 mb-1">Tên đăng nhập</label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/40 outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">Mật khẩu</label>
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/40 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-medium"
        >
          Đăng nhập
        </button>
      </form>
    </div>
  );
}
