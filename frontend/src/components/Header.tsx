import { MessageCircle, UserCircle, LogOut, SendHorizonal, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useSettings } from "../context/SettingsContext";

export default function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // --- Chatbot ---
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
const detectIntent = (text: string) => {
  const t = text.toLowerCase();

  if (t.includes("nhân viên") || t.includes("employee")) return "/employees";
  if (t.includes("đơn hàng") || t.includes("order")) return "/orders";
  if (t.includes("sản phẩm") || t.includes("product")) return "/products";
  if (t.includes("khách hàng") || t.includes("customer")) return "/customers";
  if (t.includes("báo cáo") || t.includes("report")) return "/report";
  if (t.includes("doanh thu") || t.includes("revenue")) return "/revenue";
  if (t.includes("quyền") || t.includes("admin") || t.includes("phân quyền")) return "/admin/roles";
  if (t.includes("cài đặt") || t.includes("setting")) return "/settings";

  return null;
};
  // --- Notifications (API) ---
  const [showNotify, setShowNotify] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/notifications");
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.log("Lỗi tải thông báo:", err);
    }
  };

  const { settings } = useSettings();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
const username = user.username || "Người dùng";
const role = user.role || "user";


  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Auto scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Gửi tin nhắn Chatbot
  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);

    const userMessage = { sender: "Bạn", text: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("http://127.0.0.1:8000/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await res.json();
      const aiMessage = { sender: "Tuấn AI", text: data.reply };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "Tuấn AI", text: "⚠️ Không thể kết nối đến máy chủ." },
      ]);
    }

    setInput("");
    setLoading(false);
  };

  return (
    <header
      className="h-18 flex items-center justify-between text-white px-5 shadow relative"
      style={{ background: settings?.theme_color || "var(--theme-color)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        {settings?.logo_url ? (
          <img
            src={`http://127.0.0.1:8000${settings.logo_url}`}
            alt="Logo"
            className="w-12 h-12 rounded-full bg-white p-1 object-cover shadow"
          />
        ) : (
          <div className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full text-xs">
            {settings?.company_name?.[0] || "L"}
          </div>
        )}
        <div className="text-lg font-semibold whitespace-nowrap">
          {settings?.company_name || "Hệ thống quản lý doanh nghiệp"}
        </div>
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-4 relative">

        {/* ----- NOTIFICATION ICON ----- */}
        <span title="Thông báo" className="relative">
          <Bell
            className="opacity-90 cursor-pointer hover:opacity-100 transition"
            size={22}
            onClick={() => {
              setShowNotify(!showNotify);
              setShowChat(false);
              fetchNotifications(); // ⭐ Load API khi mở panel
            }}
          />

          {/* Badge số lượng */}
          {notifications.length > 0 && (
            <span className="absolute -top-2 -right-1 bg-red-500 text-white text-xs px-1.5 py-[1px] rounded-full shadow">
              {notifications.length}
            </span>
          )}
        </span>

        {/* ----- CHAT ICON ----- */}
        <span title="Trợ lý Tuấn AI">
          <MessageCircle
            className="opacity-90 cursor-pointer hover:opacity-100 transition"
            size={22}
            onClick={() => {
              setShowChat(!showChat);
              setShowNotify(false);
            }}
          />
        </span>

        {/* ----- USER MENU ----- */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:opacity-100 transition"
          >
            <UserCircle size={28} className="opacity-90" />
          <span className="text-sm hidden sm:inline">
  {(
    {
      admin: "Quản trị viên",
      manager: "Quản lý",
      quanly: "Quản lý",
      user: "Người dùng",
      employee: "Nhân viên",
    } as any
  )[role] || "Người dùng"} ({username})
</span>



          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-slate-700 rounded-lg shadow-lg border overflow-hidden z-10">
              <button
                onClick={() => navigate("/admin/users")}
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
              >
                Trang quản trị
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===================== NOTIFICATION PANEL ===================== */}
      {showNotify && (
        <div className="absolute top-14 right-24 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col animate-fadeIn z-50">

          {/* Header */}
          <div
            className="px-4 py-3 font-semibold flex justify-between items-center text-white"
            style={{ background: settings?.theme_color || "#2563EB" }}
          >
            <span>🔔 Thông báo</span>
            <button
              onClick={() => setShowNotify(false)}
              className="text-white text-sm opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-3 overflow-y-auto bg-gray-50 h-72 space-y-2 scrollbar-thin">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-sm italic text-center mt-12">
                Không có thông báo nào.
              </p>
            ) : (
             notifications.map((n) => (
  <div key={n.id} className="bg-white border rounded-lg p-3 shadow-sm">
    <p className="font-medium text-sm text-gray-900">{n.title}</p>


    {/* thời gian custom */}
    <p className="text-xs text-gray-500 mt-1">
      {n.time || "Vừa xong"}
    </p>

    {/* created_at chuẩn ISO → convert sang VN */}
    {n.created_at && (
      <p className="text-[10px] text-gray-400 mt-1">
        {new Date(n.created_at).toLocaleString("vi-VN")}
      </p>
    )}
  </div>
))

            )}
          </div>
        </div>
      )}

      {/* ===================== CHATBOT POPUP ===================== */}
      {showChat && (
        <div className="absolute top-14 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col animate-fadeIn z-50">

          {/* Header */}
          <div
            className="px-4 py-3 font-semibold flex justify-between items-center text-white"
            style={{ background: settings?.theme_color || "#2563EB" }}
          >
            <span>🤖 Trợ lý Tuấn AI</span>
            <button
              onClick={() => setShowChat(false)}
              className="text-white text-sm opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>

          {/* Chat body */}
          <div
            ref={chatRef}
            className="p-3 overflow-y-auto bg-gray-50 h-72 space-y-3 scrollbar-thin"
          >
            {messages.length === 0 && (
              <p className="text-gray-400 text-sm italic text-center mt-12">
                💬 Hãy bắt đầu trò chuyện với Tuấn AI...
              </p>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === "Bạn" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`px-3 py-2 rounded-2xl text-sm max-w-[80%] ${
                    m.sender === "Bạn"
                      ? "bg-blue-600 text-white rounded-br-none shadow"
                      : "bg-gray-200 text-gray-800 rounded-bl-none shadow"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-gray-400 italic text-sm text-center">
                Tuấn AI đang suy nghĩ...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex border-t p-2 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-full outline-none text-sm text-slate-800 placeholder:text-slate-400"
              placeholder="💬 Nhập tin nhắn..."
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition flex items-center justify-center"
            >
              <SendHorizonal size={18} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
