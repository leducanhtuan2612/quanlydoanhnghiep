// src/pages/CRM.tsx
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

// =============================
// TYPE DEFINITIONS
// =============================
type Customer = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

type CustomerNote = {
  id: number;
  customer_id: number;
  title: string;
  content?: string;
  created_by?: string;
  created_at: string;
};

type OrderShort = {
  id: number;
  date: string;
  amount: number;
  status: string;
};

type CustomerDetailCRM = {
  customer: Customer;
  notes: CustomerNote[];
  orders: OrderShort[];
};

type EmailTemplate = {
  id: number;
  name: string;
  subject: string;
  body: string;
  created_at: string;
};

// =============================
// CRM PAGE COMPONENT
// =============================
export default function CRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [detail, setDetail] = useState<CustomerDetailCRM | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // =======================
  // LOAD CUSTOMER LIST + EMAIL TEMPLATE
  // =======================
  useEffect(() => {
    // ❗ FIX API: lấy danh sách khách hàng đúng endpoint `/customers`
    axios.get<Customer[]>(`${API_BASE}/customers`).then((res) => {
      setCustomers(res.data);
      if (res.data.length > 0) {
        setSelectedCustomerId(res.data[0].id);
      }
    });

    axios.get<EmailTemplate[]>(`${API_BASE}/crm/email-templates`).then((res) => {
      setTemplates(res.data);
      if (res.data.length > 0) {
        setSelectedTemplateId(res.data[0].id);
      }
    });
  }, []);

  // =======================
  // LOAD CRM DETAIL (notes + orders)
  // =======================
  useEffect(() => {
    if (!selectedCustomerId) return;

    setLoadingDetail(true);
    axios
      .get<CustomerDetailCRM>(`${API_BASE}/crm/customers/${selectedCustomerId}/detail`)
      .then((res) => setDetail(res.data))
      .finally(() => setLoadingDetail(false));
  }, [selectedCustomerId]);

  // =======================
  // ADD A NOTE
  // =======================
  const handleAddNote = async () => {
    if (!selectedCustomerId || !noteTitle.trim()) return;

    const payload = {
      customer_id: selectedCustomerId,
      title: noteTitle,
      content: noteContent,
    };

    const res = await axios.post<CustomerNote>(`${API_BASE}/crm/notes`, payload);

    setDetail((prev) =>
      prev ? { ...prev, notes: [res.data, ...prev.notes] } : prev
    );

    setNoteTitle("");
    setNoteContent("");
  };

  // =======================
  // SEND EMAIL MARKETING
  // =======================
  const handleSendEmail = async () => {
    if (!selectedCustomerId || !selectedTemplateId) return;

    try {
      setSendingEmail(true);

      await axios.post(`${API_BASE}/crm/send-email`, {
        template_id: selectedTemplateId,
        customer_ids: [selectedCustomerId],
      });

      alert("Đã gửi email (hoặc đưa vào hàng đợi).");
    } catch (err) {
      alert("Lỗi gửi email. Kiểm tra lại cấu hình SMTP backend.");
    } finally {
      setSendingEmail(false);
    }
  };

  // =======================
  // UI RENDER
  // =======================
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Khách hàng (CRM)</h1>

      <div className="grid grid-cols-12 gap-4">
        {/* =============================
            CUSTOMER LIST
        ============================== */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h2 className="font-semibold">Danh sách khách hàng</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-4 py-2">Tên</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Điện thoại</th>
                    <th className="px-4 py-2">Địa chỉ</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      className={`border-t cursor-pointer hover:bg-slate-50 ${
                        c.id === selectedCustomerId ? "bg-blue-50" : ""
                      }`}
                      onClick={() => setSelectedCustomerId(c.id)}
                    >
                      <td className="px-4 py-2 font-medium">{c.name}</td>
                      <td className="px-4 py-2">{c.email}</td>
                      <td className="px-4 py-2">{c.phone}</td>
                      <td className="px-4 py-2">{c.address}</td>
                    </tr>
                  ))}

                  {customers.length === 0 && (
                    <tr>
                      <td className="px-4 py-3 text-center text-slate-400" colSpan={4}>
                        Không có khách hàng nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* =============================
            CRM DETAIL SECTION
        ============================== */}
        <div className="col-span-12 lg:col-span-6 space-y-4">

          {/* NOTES */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h2 className="font-semibold">Ghi chú khách hàng</h2>
            </div>

            {/* ADD NOTE */}
            <div className="p-4 border-b">
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
                placeholder="Tiêu đề ghi chú..."
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
                placeholder="Nội dung ghi chú..."
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />

              <button
                onClick={handleAddNote}
                disabled={!noteTitle.trim()}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
              >
                + Thêm ghi chú
              </button>
            </div>

            {/* NOTES LIST */}
            <div className="p-4 max-h-64 overflow-y-auto">
              {loadingDetail && (
                <div className="text-sm text-slate-400">Đang tải...</div>
              )}

              {!loadingDetail && detail?.notes.length === 0 && (
                <div className="text-sm text-slate-400">Chưa có ghi chú nào.</div>
              )}

              {detail?.notes.map((n) => (
                <div key={n.id} className="mb-3 pb-3 border-b last:pb-0 last:border-none">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{n.title}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(n.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  {n.content && (
                    <div className="text-sm text-slate-600 mt-1">{n.content}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* =============================
              ORDER HISTORY + EMAIL MARKETING
          ============================== */}
          <div className="grid grid-cols-12 gap-4">

            {/* ORDER HISTORY */}
            <div className="col-span-12 lg:col-span-7 bg-white rounded-xl shadow-sm border">
              <div className="px-4 py-3 border-b">
                <h2 className="font-semibold">Lịch sử mua hàng</h2>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto text-sm">
                {!loadingDetail && detail?.orders.length === 0 && (
                  <div className="text-slate-400">Chưa có đơn hàng.</div>
                )}

                {detail?.orders.map((o) => (
                  <div key={o.id} className="flex justify-between border-b py-2">
                    <div>
                      <div className="font-medium">Mã đơn #{o.id}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(o.date).toLocaleDateString("vi-VN")} – {o.status}
                      </div>
                    </div>
                    <div className="font-semibold">
                      ₫{o.amount.toLocaleString("vi-VN")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EMAIL MARKETING */}
            <div className="col-span-12 lg:col-span-5 bg-white rounded-xl shadow-sm border">
              <div className="px-4 py-3 border-b">
                <h2 className="font-semibold">Gửi Email Marketing</h2>
              </div>

              <div className="p-4 space-y-3 text-sm">
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
                  disabled={!selectedCustomerId || !selectedTemplateId || sendingEmail}
                  className="w-full px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60"
                >
                  {sendingEmail ? "Đang gửi..." : "Gửi email"}
                </button>

                <p className="text-xs text-slate-400">
                  Email được gửi qua SMTP backend (.env SMTP settings).
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
