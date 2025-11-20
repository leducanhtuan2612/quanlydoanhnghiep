import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useSettings from "../hooks/useSettings";

const API = "http://127.0.0.1:8000";

export default function Register() {
  const navigate = useNavigate();
  const settings = useSettings();

  const theme = settings?.theme_color || "#22c55e";

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    confirm: ""
  });

  const [error, setError] = useState("");

  const onChange = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Mật khẩu không trùng khớp!");
      return;
    }

    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) navigate("/login");
    else {
      const data = await res.json().catch(() => null);
      setError(data?.detail || "Lỗi đăng ký");
    }
  };

  return (
    <div
      className="h-screen flex items-center justify-center"
      style={{
        background: `linear-gradient(to bottom right, ${theme}, ${theme}99)`
      }}
    >
      <form
        className="bg-white p-8 rounded-xl shadow-xl w-[450px]"
        onSubmit={handleSubmit}
      >

        <h1
          className="text-center text-2xl font-semibold mb-6"
          style={{ color: theme }}
        >
          Đăng ký tài khoản
        </h1>

        {error && (
          <p className="text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-sm mb-4">
            {error}
          </p>
        )}

        {[["full_name", "Họ và tên"],
          ["username", "Tên đăng nhập"],
          ["email", "Email"],
          ["password", "Mật khẩu"],
          ["confirm", "Nhập lại mật khẩu"]
        ].map(([key, label]) => (
          <div className="mb-4" key={key}>
            <label className="text-sm">{label}</label>
            <input
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500/40 outline-none"
              name={key}
              type={key.includes("password") ? "password" : "text"}
              value={(form as any)[key]}
              onChange={onChange}
            />
          </div>
        ))}

        <button
          className="w-full text-white font-medium py-2 rounded-lg"
          style={{ backgroundColor: theme }}
        >
          Đăng ký
        </button>

        <p className="text-center text-sm mt-4">
          Đã có tài khoản?
          <Link to="/login" className="ml-1 underline" style={{ color: theme }}>
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
