import { useEffect, useState } from "react";
import { Plus, Pencil, X, Check, Trash2 } from "lucide-react";

const API = "http://127.0.0.1:8000";

// =======================
// TYPES
// =======================
type Customer = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
};

type CustomerNote = {
  id: number;
  title: string;
  content?: string;
  created_at: string;
};

type OrderShort = {
  id: number;
  date: string;
  status: string;
  amount: number;
};

type EmailTemplate = {
  id: number;
  name: string;
  subject: string;
  body: string;
};

type CustomerDetailCRM = {
  customer: Customer;
  notes: CustomerNote[];
  orders: OrderShort[];
};

// =======================
// MAIN PAGE
// =======================
export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const [openCRM, setOpenCRM] = useState(false);
  const [crmData, setCrmData] = useState<CustomerDetailCRM | null>(null);

  // Load danh sách khách
  useEffect(() => {
    fetch(`${API}/customers`)
      .then((res) => res.json())
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, []);

  // Mở popup CRM
  const openCRMDetail = async (id: number) => {
    try {
      // ✅ Dùng đúng endpoint CRM
      const res = await fetch(`${API}/crm/customers/${id}/detail`);
      if (!res.ok) {
        alert("Không tải được dữ liệu CRM");
        return;
      }
      const data = (await res.json()) as CustomerDetailCRM;
      setCrmData(data);
      setOpenCRM(true);
    } catch {
      alert("Lỗi khi tải chi tiết CRM");
    }
  };

  // Thêm / sửa khách
  const saveCustomer = async (c: Omit<Customer, "id">, id?: number) => {
    const method = id ? "PUT" : "POST";
    const url = id ? `${API}/customers/${id}` : `${API}/customers`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c),
    });

    const data = await res.json();
    if (res.ok) {
      if (id) {
        setCustomers((prev) => prev.map((p) => (p.id === id ? data : p)));
      } else {
        setCustomers((prev) => [data, ...prev]);
      }
      setOpenModal(false);
      setEditing(null);
    } else {
      alert(data.detail || "Lỗi khi lưu khách hàng");
    }
  };

  // Xóa khách
  const deleteCustomer = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa khách hàng này?")) return;
    await fetch(`${API}/customers/${id}`, { method: "DELETE" });
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  if (loading) return <p>Đang tải...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Quản lý Khách hàng</h1>

      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditing(null);
            setOpenModal(true);
          }}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} /> Thêm khách hàng
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left">Tên</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">SĐT</th>
              <th className="px-4 py-2 text-left">Địa chỉ</th>
              <th className="px-4 py-2 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.email}</td>
                <td className="px-4 py-2">{c.phone}</td>
                <td className="px-4 py-2">{c.address}</td>
                <td className="px-4 py-2 text-right space-x-2">
                  <button
                    className="px-2 py-1 border rounded text-blue-600 hover:bg-blue-50"
                    onClick={() => openCRMDetail(c.id)}
                  >
                    📘 Chi tiết
                  </button>

                  <button
                    onClick={() => {
                      setEditing(c);
                      setOpenModal(true);
                    }}
                    className="px-2 py-1 border rounded hover:bg-slate-50 inline-flex items-center gap-1"
                  >
                    <Pencil size={14} /> Sửa
                  </button>

                  <button
                    onClick={() => deleteCustomer(c.id)}
                    className="px-2 py-1 border rounded text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                </td>
              </tr>
            ))}

            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                  Không có khách hàng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal thêm/sửa khách hàng */}
      {openModal && (
        <CustomerFormModal
          initial={
            editing ?? {
              id: 0,
              name: "",
              email: "",
              phone: "",
              address: "",
            }
          }
          onClose={() => setOpenModal(false)}
          onSave={(u) =>
            saveCustomer(
              { name: u.name, email: u.email, phone: u.phone, address: u.address },
              editing?.id
            )
          }
        />
      )}

      {/* Modal CRM */}
      {openCRM && crmData && <CRMModal data={crmData} onClose={() => setOpenCRM(false)} />}
    </div>
  );
}

// ===================================================================
// FORM CUSTOMER MODAL
// ===================================================================
function CustomerFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Customer;
  onClose: () => void;
  onSave: (u: Customer) => void;
}) {
  const [form, setForm] = useState<Customer>(initial);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <h3 className="font-semibold">
            {initial.id ? "Sửa khách hàng" : "Khách hàng mới"}
          </h3>
          <button className="p-1" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {["name", "email", "phone", "address"].map((field) => (
            <div key={field}>
              <label className="block text-sm text-slate-600 mb-1">
                {field === "name"
                  ? "Họ tên"
                  : field === "email"
                  ? "Email"
                  : field === "phone"
                  ? "Số điện thoại"
                  : "Địa chỉ"}
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={(form as any)[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border">
            Hủy
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
          >
            <Check size={16} /> Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// CRM MODAL — CHUẨN & FULL CHỨC NĂNG
// ===================================================================
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Tải danh sách mẫu email
  useEffect(() => {
    fetch(`${API}/crm/email-templates`)
      .then((res) => res.json())
      .then((list) => {
        setTemplates(list);
        if (list.length > 0) setSelectedTemplateId(list[0].id);
      });
  }, []);

  // Thêm ghi chú
  const handleAddNote = async () => {
    if (!noteTitle.trim()) return;

    const payload = {
      customer_id: data.customer.id,
      title: noteTitle,
      content: noteContent,
    };

    try {
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
    } catch {
      alert("Lỗi khi thêm ghi chú");
    }
  };

  // Xóa ghi chú
  const deleteNote = async (noteId: number) => {
    if (!confirm("Bạn có chắc muốn xóa ghi chú này?")) return;

    try {
      const res = await fetch(`${API}/crm/notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Không thể xóa ghi chú");
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch {
      alert("Lỗi khi xóa ghi chú");
    }
  };

  // Gửi email marketing
  const handleSendEmail = async () => {
    if (!selectedTemplateId) return;

    try {
      setSendingEmail(true);
      const res = await fetch(`${API}/crm/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          customer_ids: [data.customer.id],
        }),
      });

      if (!res.ok) {
        alert("Gửi email thất bại, kiểm tra lại backend / SMTP.");
        return;
      }

      alert("Đã gửi email (hoặc đưa vào hàng đợi).");
    } catch {
      alert("Gửi email thất bại, kiểm tra lại backend / mạng.");
    } finally {
      setSendingEmail(false);
    }
  };

  // Format trạng thái đơn
  const formatStatus = (s: string) => {
    switch (s) {
      case "completed":
        return "✔ Hoàn thành";
      case "pending":
        return "⏳ Đang xử lý";
      case "cancelled":
        return "❌ Đã hủy";
      default:
        return s;
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
          <p>
            <b>Email:</b> {data.customer.email}
          </p>
          <p>
            <b>SĐT:</b> {data.customer.phone}
          </p>
          <p>
            <b>Địa chỉ:</b> {data.customer.address}
          </p>
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
          {notes.length === 0 && <p className="text-slate-500">Chưa có ghi chú.</p>}

          {notes.map((n) => (
            <div key={n.id} className="border-b pb-2 mb-2 last:border-b-0">
              <div className="flex justify-between items-center">
                <p className="font-bold">{n.title}</p>
                <button
                  className="text-red-600 hover:bg-red-100 p-1 rounded"
                  onClick={() => deleteNote(n.id)}
                  title="Xóa ghi chú"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {n.content && <p className="mt-1">{n.content}</p>}
              <span className="text-xs text-slate-500">
                {new Date(n.created_at).toLocaleString("vi-VN")}
              </span>
            </div>
          ))}
        </div>

        {/* EMAIL + LỊCH SỬ */}
        <div className="grid grid-cols-12 gap-4">
          {/* LỊCH SỬ MUA HÀNG */}
          <div className="col-span-12 lg:col-span-7">
            <h3 className="text-lg font-semibold mb-2">Lịch sử mua hàng</h3>
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              {data.orders.length === 0 && (
                <p className="text-slate-500">Chưa có đơn hàng.</p>
              )}

              {[...data.orders]
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((o) => (
                  <div key={o.id} className="flex justify-between border-b py-2">
                    <div>
                      <p className="font-semibold">Đơn #{o.id}</p>
                      <p className="text-xs text-slate-500">
                        {formatStatus(o.status)} –{" "}
                        {new Date(o.date).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <p className="font-bold">
                      ₫{o.amount.toLocaleString("vi-VN")}
                    </p>
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
                    setSelectedTemplateId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                >
                  {templates.length === 0 && (
                    <option>Chưa có mẫu email</option>
                  )}

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

              <p className="text-xs text-slate-400">
                Email được gửi từ backend thông qua SMTP.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
