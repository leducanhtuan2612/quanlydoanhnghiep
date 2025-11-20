import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useSettings from "../hooks/useSettings";

const API = "http://127.0.0.1:8000";

export default function Login() {
  const navigate = useNavigate();
  const settings = useSettings(); // ⬅ Lấy theme từ backend

  const theme = settings?.theme_color || "#2563eb";
  const logo = settings?.logo_url || "";

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
        setError(data.detail);
        return;
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("role", data.role);

      navigate("/");
    } catch {
      setError("Lỗi kết nối server");
    }
  };

  return (
    <div
      className="h-screen flex items-center justify-center"
      style={{
        background: `linear-gradient(to bottom right, ${theme}, ${theme}99)`
      }}
    >
      <form className="bg-white p-8 rounded-xl shadow-xl w-[420px]" onSubmit={handleLogin}>
      
        <h1 className="text-2xl font-semibold text-center mb-4" style={{ color: theme }}>
          Đăng nhập hệ thống
        </h1>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <div className="mb-3">
          <label className="text-sm">Tên đăng nhập</label>
          <input className="w-full border px-3 py-2 rounded-lg" value={username}
                 onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div className="mb-4">
          <label className="text-sm">Mật khẩu</label>
          <input className="w-full border px-3 py-2 rounded-lg" type="password"
                 value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button
          className="w-full text-white font-medium py-2 rounded-lg"
          style={{ backgroundColor: theme }}
        >
          Đăng nhập
        </button>

        <p className="text-center text-sm mt-4">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="underline" style={{ color: theme }}>
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </div>
  );
}
