import { useEffect, useRef, useState } from "react";
import api from "../../api";

/* =========================
   TYPES
========================= */
type Employee = {
  id: number;
  name: string;
  position?: string | null;
};

type Conversation = {
  id: number;
  type: "private" | "group";
};

type Message = {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
};

/* =========================
   COMPONENT
========================= */
export default function ChatPage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const employeeId: number = user.employee_id;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatTitle, setChatTitle] = useState("");

  const wsRef = useRef<WebSocket | null>(null);

  /* =========================
     LOAD EMPLOYEES
  ========================= */
  useEffect(() => {
    api.get<Employee[]>("/chat/employees").then((res) => {
      setEmployees(res.data.filter((e) => e.id !== employeeId));
    });

    return () => wsRef.current?.close();
  }, [employeeId]);

  /* =========================
     OPEN GROUP CHAT
  ========================= */
  async function openGroupChat() {
    wsRef.current?.close();
    setMessages([]);

    const res = await api.get<Conversation>(
      "/chat/conversations/group",
      { params: { employee_id: employeeId } }
    );

    setActiveConv(res.data);
    setChatTitle("💬 Chat tổng nhân viên");

    const msgRes = await api.get<Message[]>(
      `/chat/messages/${res.data.id}`
    );
    setMessages(msgRes.data);

    connectWS(res.data.id);
  }

  /* =========================
     OPEN PRIVATE CHAT
  ========================= */
  async function openChat(emp: Employee) {
    wsRef.current?.close();
    setMessages([]);

    const res = await api.post<Conversation>(
      "/chat/conversations/private",
      { other_employee_id: emp.id },
      { params: { employee_id: employeeId } }
    );

    setActiveConv(res.data);
    setChatTitle(`💬 Chat với ${emp.name}`);

    const msgRes = await api.get<Message[]>(
      `/chat/messages/${res.data.id}`
    );
    setMessages(msgRes.data);

    connectWS(res.data.id);
  }

  /* =========================
     WEBSOCKET
  ========================= */
  function connectWS(conversationId: number) {
    wsRef.current?.close();

    const ws = new WebSocket(
      `ws://127.0.0.1:8000/chat/ws/${conversationId}?employee_id=${employeeId}`
    );

    ws.onmessage = (e) => {
      const data: Message = JSON.parse(e.data);
      setMessages((prev) => [...prev, data]);
    };

    wsRef.current = ws;
  }

  /* =========================
     SEND MESSAGE
  ========================= */
  function sendMessage(content: string) {
    if (!wsRef.current) return;
    if (wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ content }));
  }

  /* =========================
     UI
  ========================= */
  return (
   <div className="p-4 h-[calc(100vh-64px)] overflow-hidden">

      <div className="grid grid-cols-12 h-full bg-white rounded-2xl border shadow-sm overflow-hidden">

        {/* ================= LEFT ================= */}
        <div className="col-span-4 border-r p-3 flex flex-col">
          <h2 className="font-semibold mb-3">💬 Trò chuyện nội bộ</h2>

          <button
            onClick={openGroupChat}
            className="w-full mb-3 px-3 py-2 rounded-xl border bg-gray-100 hover:bg-gray-200 text-left font-medium"
          >
            💬 Chat tổng nhân viên
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {employees.map((e) => (
              <button
                key={e.id}
                onClick={() => openChat(e)}
                className="w-full text-left px-3 py-2 rounded-xl border hover:bg-gray-50"
              >
                <div className="font-medium">{e.name}</div>
                <div className="text-xs text-gray-500">
                  {e.position || "Nhân viên"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="col-span-8 flex flex-col h-full min-h-0">

          {/* HEADER */}
          <div className="p-3 border-b font-semibold shrink-0">
            {activeConv ? chatTitle : "Chọn người hoặc chat tổng"}
          </div>

          {/* 🔥 CHỈ PHẦN NÀY CUỘN */}
          <div className="flex-1 min-h-0 p-4 overflow-y-auto bg-gray-50">
            {messages.map((m) => {
              const mine = m.sender_id === employeeId;

              return (
                <div
                  key={m.id}
                  className={`flex mb-3 ${
                    mine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] px-3 py-2 rounded-2xl border shadow-sm ${
                      mine ? "bg-black text-white" : "bg-white"
                    }`}
                  >
                    <div className="text-sm">{m.content}</div>
                    <div className="text-[11px] mt-1 text-gray-400">
                      {mine ? "Bạn" : m.sender_name} ·{" "}
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* INPUT */}
          <div className="shrink-0">
            <ChatInput disabled={!activeConv} onSend={sendMessage} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   INPUT
========================= */
function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (c: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");

  function send() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <div className="p-3 border-t flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        disabled={disabled}
        placeholder="Nhập tin nhắn..."
        className="flex-1 px-3 py-2 rounded-xl border outline-none"
      />
      <button
        onClick={send}
        disabled={disabled}
        className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
      >
        Gửi
      </button>
    </div>
  );
}
