import { MessageCircle, UserCircle, LogOut, SendHorizonal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useSettings } from "../context/SettingsContext";

export default function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { settings } = useSettings();
  const chatRef = useRef<HTMLDivElement>(null);

  const username = localStorage.getItem("username") || "Người dùng";
  const role = localStorage.getItem("role") || "user";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // ===== Gửi tin nhắn đến chatbot =====
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
        { sender: "Tuấn AI", text: "⚠️ Không thể kết nối đến máy chủ. Vui lòng thử lại sau." },
      ]);
    }

    setInput("");
    setLoading(false);
  };

  return (
    <header
      className="h-14 flex items-center justify-between text-white px-5 shadow transition-all relative"
      style={{
        background: settings?.theme_color || "var(--theme-color)",
      }}
    >
      {/* ===== Logo & tên công ty ===== */}
      <div className="flex items-center gap-2">
        {settings?.logo_url ? (
          <img
            src={`http://127.0.0.1:8000${settings.logo_url}`}
            alt="Logo"
            className="w-8 h-8 rounded-full bg-white p-[2px] object-cover"
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

      {/* ===== Khu vực Chatbot & người dùng ===== */}
      <div className="flex items-center gap-4 relative">
        {/* Icon Chatbot */}
        <span title="Trợ lý Tuấn AI">
          <MessageCircle
            className="opacity-90 cursor-pointer hover:opacity-100 transition"
            size={22}
            onClick={() => setShowChat(!showChat)}
          />
        </span>

        {/* Nút người dùng */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:opacity-100 transition"
          >
            <UserCircle size={28} className="opacity-90" />
            <span className="text-sm hidden sm:inline">
              {username} ({role})
            </span>
          </button>

          {/* Menu dropdown */}
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

      {/* ===== Popup Chatbot Tuấn AI ===== */}
      {showChat && (
        <div className="absolute top-14 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fadeIn z-50">
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

          {/* Khung hội thoại */}
          <div
            ref={chatRef}
            className="flex-1 p-3 overflow-y-auto h-72 bg-gray-50 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          >
            {messages.length === 0 && (
              <p className="text-gray-400 text-sm italic text-center mt-12">
                💬 Hãy bắt đầu trò chuyện với Tuấn AI...
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.sender === "Bạn" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl text-sm max-w-[80%] leading-relaxed ${
                    m.sender === "Bạn"
                      ? "bg-blue-600 text-white rounded-br-none shadow-sm"
                      : "bg-gray-200 text-gray-800 rounded-bl-none shadow-sm"
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

          {/* Ô nhập tin nhắn */}
          <div className="flex border-t p-2 bg-white">
           <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
             className="flex-1 px-3 py-2 border border-gray-200 rounded-full outline-none text-sm text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-400"
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
