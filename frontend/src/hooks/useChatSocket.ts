import { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
}

export default function useChatSocket(
  conversationId?: number,
  employeeId?: number
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!conversationId || !employeeId) return;

    const ws = new WebSocket(
      `ws://127.0.0.1:8000/chat/ws/${conversationId}?employee_id=${employeeId}`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    wsRef.current = ws;

    return () => ws.close();
  }, [conversationId, employeeId]);

  const sendMessage = (content: string) => {
    if (!wsRef.current || !content.trim()) return;
    wsRef.current.send(JSON.stringify({ content }));
  };

  return { messages, setMessages, sendMessage };
}
