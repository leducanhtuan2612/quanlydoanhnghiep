// components/chat/MessageList.tsx
type Message = {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
};

type Props = {
  messages: Message[];
  meId: number;
};

export default function MessageList({ messages, meId }: Props) {
  return (
    <div className="space-y-3">
      {messages.map((m) => {
        const mine = m.sender_id === meId;

        return (
          <div
            key={m.id}
            className={`flex ${mine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-3 py-2 border shadow-sm ${
                mine ? "bg-black text-white" : "bg-white"
              }`}
            >
              <div className="text-sm">{m.content}</div>

              <div
                className={`text-[11px] mt-1 ${
                  mine ? "text-gray-300" : "text-gray-500"
                }`}
              >
                {mine ? "Bạn" : `NV #${m.sender_id}`} ·{" "}
                {new Date(m.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
