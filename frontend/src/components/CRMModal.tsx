function CRMModal({
  data,
  onClose,
}: {
  data: CustomerDetailCRM;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState<CustomerNote[]>(data.notes || []);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  );
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetch(`${API}/crm/email-templates`)
      .then((res) => res.json())
      .then((list) => {
        setTemplates(list);
        if (list.length > 0) setSelectedTemplateId(list[0].id);
      });
  }, []);

  // ============================
  // 👉 THÊM GHI CHÚ
  // ============================
  const handleAddNote = async () => {
    if (!noteTitle.trim()) return;

    const payload = {
      customer_id: data.customer.id,
      title: noteTitle,
      content: noteContent,
    };

    const res = await fetch(`${API}/crm/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("Không thể thêm ghi chú");
      return;
    }

    const newNote = (await res.json()) as CustomerNote;
    setNotes((prev) => [newNote, ...prev]);

    setNoteTitle("");
    setNoteContent("");
  };

  // ============================
  // ❌ XOÁ GHI CHÚ
  // ============================
  const deleteNote = async (noteId: number) => {
    if (!confirm("Bạn có chắc muốn xoá ghi chú này?")) return;

    const res = await fetch(`${API}/crm/notes/${noteId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Xoá thất bại");
      return;
    }

    // Xoá khỏi UI
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  // ============================
  // 📧 GỬI EMAIL
  // ============================
  const handleSendEmail = async () => {
    if (!selectedTemplateId) return;

    try {
      setSendingEmail(true);
      await fetch(`${API}/crm/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          customer_ids: [data.customer.id],
        }),
      });
      alert("Đã gửi email.");
    } catch (err) {
      alert("Lỗi gửi email.");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-center p-6 overflow-auto">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-xl p-6 relative">
        <button className="absolute right-4 top-4" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold mb-4">CRM – {data.customer.name}</h2>

        {/* THÔNG TIN KHÁCH */}
        <div className="border rounded-lg p-4 bg-slate-50 mb-6">
          <p><b>Email:</b> {data.customer.email}</p>
          <p><b>SĐT:</b> {data.customer.phone}</p>
          <p><b>Địa chỉ:</b> {data.customer.address}</p>
        </div>

        {/* THÊM GHI CHÚ */}
        <h3 className="text-lg font-semibold mb-2">Thêm ghi chú</h3>
        <div className="border rounded-lg p-4 mb-6">
          <input
            className="w-full border rounded-lg px-3 py-2 mb-2"
            placeholder="Tiêu đề ghi chú"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2 mb-2"
            placeholder="Nội dung ghi chú"
            rows={3}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
          <button
            onClick={handleAddNote}
            disabled={!noteTitle.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            + Thêm ghi chú
          </button>
        </div>

        {/* DANH SÁCH GHI CHÚ */}
        <h3 className="text-lg font-semibold mb-2">Ghi chú khách hàng</h3>
        <div className="border rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
          {notes.length === 0 && (
            <p className="text-slate-500">Chưa có ghi chú.</p>
          )}

          {notes.map((n) => (
            <div key={n.id} className="border-b pb-2 mb-2 last:border-b-0">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{n.title}</p>
                  {n.content && <p className="text-sm">{n.content}</p>}
                  <p className="text-xs text-slate-500">
                    {new Date(n.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>

                {/* NÚT XOÁ */}
                <button
                  onClick={() => deleteNote(n.id)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* EMAIL + LỊCH SỬ MUA HÀNG */}
        <div className="grid grid-cols-12 gap-4">
          {/* LỊCH SỬ MUA HÀNG */}
          <div className="col-span-12 lg:col-span-7">
            <h3 className="text-lg font-semibold mb-2">Lịch sử mua hàng</h3>
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              {data.orders.length === 0 && (
                <p className="text-slate-500">Chưa có đơn hàng.</p>
              )}
              {data.orders.map((o) => (
                <div key={o.id} className="flex justify-between border-b py-2">
                  <div>
                    <p className="font-semibold">Đơn #{o.id}</p>
                    <p className="text-xs text-slate-500">
                      {o.status} – {new Date(o.date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <p className="font-bold">₫{o.amount.toLocaleString("vi-VN")}</p>
                </div>
              ))}
            </div>
          </div>

          {/* EMAIL MARKETING */}
          <div className="col-span-12 lg:col-span-5">
            <h3 className="text-lg font-semibold mb-2">Gửi email marketing</h3>
            <div className="border rounded-lg p-4 space-y-3 text-sm">
              <label className="block text-slate-700 text-sm">
                Mẫu email
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={selectedTemplateId ?? ""}
                  onChange={(e) =>
                    setSelectedTemplateId(Number(e.target.value))
                  }
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                onClick={handleSendEmail}
                disabled={!selectedTemplateId || sendingEmail}
                className="w-full px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60"
              >
                {sendingEmail ? "Đang gửi..." : "Gửi email"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
