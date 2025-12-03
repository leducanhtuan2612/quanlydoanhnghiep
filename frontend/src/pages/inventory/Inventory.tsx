import { useEffect, useState } from "react";
import {
  Pencil,
  Trash2,
  X,
  Check,
  PlusCircle,
  Boxes,
  Warehouse,
  Clock,
  ListOrdered,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

type Product = {
  id: number;
  name: string;
};

type Inventory = {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  location?: string;
  date_added?: string;
  note?: string;
};

export default function InventoryPage() {
  const [items, setItems] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Inventory | null>(null);
  const [search, setSearch] = useState("");

  // ================================
  // LOAD DATA
  // ================================
  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [invRes, prodRes] = await Promise.all([
      fetch(`${API}/inventory`),
      fetch(`${API}/products`),
    ]);

    setItems(await invRes.json());
    setProducts(await prodRes.json());
    setLoading(false);
  };

  // ================================
  // SUMMARY
  // ================================
  const summary = Object.values(
    items.reduce((acc: any, i) => {
      if (!acc[i.product_id]) {
        acc[i.product_id] = {
          product_id: i.product_id,
          product_name: i.product_name,
          total_quantity: 0,
          last_location: i.location,
          last_date: i.date_added,
          last_note: i.note,
        };
      }

      acc[i.product_id].total_quantity += i.quantity;

      // Lấy bản ghi mới nhất
      if (
        new Date(i.date_added ?? 0).getTime() >
        new Date(acc[i.product_id].last_date ?? 0).getTime()
      ) {
        acc[i.product_id].last_location = i.location;
        acc[i.product_id].last_date = i.date_added;
        acc[i.product_id].last_note = i.note;
      }

      return acc;
    }, {})
  ) as any[];

  // ================================
  // SEARCH FILTER
  // ================================
  const filtered = items.filter((i) =>
    `${i.product_name} ${i.location} ${i.note}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ================================
  // SAVE (CREATE / UPDATE)
  // ================================
 const saveItem = async (form: any) => {
  const isEdit = !!editing;

  // ⭐ FIX date + giá trị rỗng
  const cleanForm = {
    ...form,
    date_added: form.date_added || null,
    location: form.location || null,
    note: form.note || null,
  };

  const method = isEdit ? "PUT" : "POST";
  const url = isEdit
    ? `http://127.0.0.1:8000/inventory/${editing.id}`
    : "http://127.0.0.1:8000/inventory";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanForm),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    console.error("❌ API Error:", data);
    alert(data?.detail || data?.message || "Có lỗi khi lưu dữ liệu!");
    return;
  }

  // Update UI
  if (isEdit) {
    setItems((x) => x.map((i) => (i.id === editing.id ? data : i)));
  } else {
    setItems((prev) => [data, ...prev]);
  }

  setEditing(null);
  setOpen(false);
};

  // ================================
  // DELETE
  // ================================
  const deleteItem = async (id: number) => {
    if (!confirm("Xác nhận xóa mục nhập kho?")) return;

    await fetch(`${API}/inventory/${id}`, { method: "DELETE" });

    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  if (loading) return <p>⏳ Đang tải…</p>;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Warehouse className="text-blue-600" />
          Quản lý Kho hàng
        </h1>

        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
        >
          <PlusCircle size={18} /> Nhập kho
        </button>
      </div>

      {/* 1️⃣ BẢNG TỔNG HỢP */}
      <div className="bg-white shadow-md border rounded-xl">
        <div className="p-4 border-b flex items-center gap-2 text-blue-600 font-semibold">
          <ListOrdered size={18} /> Tổng hợp tồn kho
        </div>

        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left">Sản phẩm</th>
              <th className="px-4 py-2 text-left">Tổng số lượng</th>
              <th className="px-4 py-2 text-left">Vị trí mới nhất</th>
              <th className="px-4 py-2 text-left">Ngày nhập gần nhất</th>
              <th className="px-4 py-2 text-left">Ghi chú gần nhất</th>
            </tr>
          </thead>

          <tbody>
            {summary.map((s) => (
              <tr key={s.product_id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2">{s.product_name}</td>
                <td className="px-4 py-2">{s.total_quantity}</td>
                <td className="px-4 py-2">{s.last_location || "-"}</td>
                <td className="px-4 py-2">
                  {s.last_date
                    ? new Date(s.last_date).toLocaleDateString("vi-VN")
                    : "-"}
                </td>
                <td className="px-4 py-2">{s.last_note || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2️⃣ LỊCH SỬ NHẬP KHO */}
      <div className="bg-white shadow-md border rounded-xl">
        <div className="p-4 border-b flex items-center gap-2 text-green-600 font-semibold">
          <Clock size={18} /> Lịch sử nhập-xuất kho
        </div>

        {/* Search */}
        <div className="p-4">
          <input
            type="text"
            className="border px-3 py-2 rounded-lg w-72"
            placeholder="Tìm theo tên, vị trí, ghi chú..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left">Sản phẩm</th>
              <th className="px-4 py-2 text-left">Số lượng</th>
              <th className="px-4 py-2 text-left">Vị trí</th>
              <th className="px-4 py-2 text-left">Ngày nhập</th>
              <th className="px-4 py-2 text-left">Ghi chú</th>
              <th className="px-4 py-2 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2">{i.product_name}</td>
                <td className="px-4 py-2">{i.quantity}</td>
                <td className="px-4 py-2">{i.location || "-"}</td>
                <td className="px-4 py-2">
                  {i.date_added
                    ? new Date(i.date_added).toLocaleDateString("vi-VN")
                    : "-"}
                </td>
                <td className="px-4 py-2">{i.note || "-"}</td>

                <td className="px-4 py-2 text-right space-x-2">
                  <button
                    onClick={() => {
                      setEditing(i);
                      setOpen(true);
                    }}
                    className="px-2 py-1 border rounded-lg hover:bg-slate-100 inline-flex items-center gap-1"
                  >
                    <Pencil size={14} /> Sửa
                  </button>

                  <button
                    onClick={() => deleteItem(i.id)}
                    className="px-2 py-1 border rounded-lg text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-3 italic text-slate-400">
                  Không tìm thấy dữ liệu phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {open && (
        <InventoryModal
          initial={
            editing ?? {
              product_id: 0,
              quantity: 1,
              location: "",
              date_added: "",
              note: "",
            }
          }
          products={products}
          onClose={() => setOpen(false)}
          onSave={saveItem}
        />
      )}
    </div>
  );
}

// =========================================
// MODAL COMPONENT
// =========================================
function InventoryModal({ initial, onClose, onSave, products }: any) {
  const [form, setForm] = useState(initial);

  const submit = () => {
    if (!form.product_id) return alert("Vui lòng chọn sản phẩm");
    if (form.quantity <= 0) return alert("Số lượng > 0");

    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl">
        <div className="p-4 border-b flex justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Boxes className="text-blue-600" />
            {initial.id ? "Sửa nhập kho" : "Nhập kho mới"}
          </h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* PRODUCT */}
          <div>
            <label className="text-sm font-medium">Sản phẩm</label>
            <select
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={form.product_id}
              onChange={(e) =>
                setForm({ ...form, product_id: Number(e.target.value) })
              }
            >
              <option value={0}>-- Chọn sản phẩm --</option>
              {products.map((p: Product) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* QTY + LOCATION */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Số lượng</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="text-sm">Vị trí</label>
              <input
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
              />
            </div>
          </div>

          {/* DATE */}
          <div>
            <label className="text-sm">Ngày nhập</label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={form.date_added}
              onChange={(e) =>
                setForm({ ...form, date_added: e.target.value })
              }
            />
          </div>

          {/* NOTE */}
          <div>
            <label className="text-sm">Ghi chú</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 border rounded-lg hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
          >
            <Check size={16} /> Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
