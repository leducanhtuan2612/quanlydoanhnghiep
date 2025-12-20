import { useState } from "react";

export default function MessageInput({
  onSend,
}: {
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="p-4 border-t flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="flex-1 border rounded-xl px-4 py-2"
        placeholder="Nhập tin nhắn..."
      />
      <button
        onClick={submit}
        className="bg-gray-700 text-white px-4 rounded-xl"
      >
        Gửi
      </button>
    </div>
  );
}
