import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

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

  // 🔹 Lấy dữ liệu kho hàng + sản phẩm
  useEffect(() => {
    async function loadData() {
      const [invRes, prodRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/inventory"),
        fetch("http://127.0.0.1:8000/products"),
      ]);
      const [invData, prodData] = await Promise.all([invRes.json(), prodRes.json()]);
      setItems(invData);
      setProducts(prodData);
      setLoading(false);
    }
    loadData();
  }, []);

  // 🔹 Thêm / Sửa kho hàng
  const saveItem = async (data: Omit<Inventory, "id" | "product_name">, id?: number) => {
    const method = id ? "PUT" : "POST";
    const url = id
      ? `http://127.0.0.1:8000/inventory/${id}`
      : "http://127.0.0.1:8000/inventory";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (res.ok) {
      if (id) {
        setItems((prev) => prev.map((x) => (x.id === id ? result : x)));
      } else {
        setItems((prev) => [result, ...prev]);
      }
      setOpen(false);
      setEditing(null);
    } else alert(result.detail || "Lỗi khi lưu dữ liệu");
  };

  // 🔹 Xóa kho hàng
  const deleteItem = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa hàng này?")) return;
    await fetch(`http://127.0.0.1:8000/inventory/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  if (loading) return <p>⏳ Đang tải dữ liệu...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Quản lý Kho hàng</h1>

      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} /> Thêm hàng hóa
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2">Tên sản phẩm</th>
              <th className="text-left px-4 py-2">Số lượng</th>
              <th className="text-left px-4 py-2">Vị trí</th>
              <th className="text-left px-4 py-2">Ngày nhập</th>
              <th className="text-left px-4 py-2">Ghi chú</th>
              <th className="text-right px-4 py-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="px-4 py-2">{i.product_name}</td>
                  <td className="px-4 py-2">{i.quantity}</td>
                  <td className="px-4 py-2">{i.location || "-"}</td>
                  <td className="px-4 py-2">
                    {i.date_added ? new Date(i.date_added).toLocaleDateString("vi-VN") : "-"}
                  </td>
                  <td className="px-4 py-2">{i.note || "-"}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditing(i);
                        setOpen(true);
                      }}
                      className="px-2 py-1 border rounded hover:bg-slate-50 inline-flex items-center gap-1"
                    >
                      <Pencil size={14} /> Sửa
                    </button>
                    <button
                      onClick={() => deleteItem(i.id)}
                      className="px-2 py-1 border rounded text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center text-slate-500 py-4 italic">
                  Không có hàng hóa nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <InventoryModal
          products={products}
          initial={
            editing ?? {
              id: 0,
              product_id: 0,
              product_name: "",
              quantity: 0,
              location: "",
              date_added: "",
              note: "",
            }
          }
          onClose={() => setOpen(false)}
          onSave={(data) =>
            saveItem(
              {
                product_id: data.product_id,
                quantity: data.quantity,
                location: data.location,
                date_added: data.date_added,
                note: data.note,
              },
              editing?.id
            )
          }
        />
      )}
    </div>
  );
}

// ======================= MODAL FORM =========================
function InventoryModal({
  initial,
  onClose,
  onSave,
  products,
}: {
  initial: Inventory;
  onClose: () => void;
  onSave: (data: Inventory) => void;
  products: Product[];
}) {
  const [form, setForm] = useState<Inventory>(initial);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">
            {initial.id ? "Sửa hàng hóa" : "Thêm hàng mới"}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* ✅ Chọn sản phẩm */}
          <div>
            <label className="block text-sm text-slate-600 mb-1">Sản phẩm</label>
            <select
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40"
              value={form.product_id}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  product_id: parseInt(e.target.value),
                }))
              }
            >
              <option value={0}>-- Chọn sản phẩm --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Số lượng</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40"
                value={form.quantity}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    quantity: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Vị trí</label>
              <input
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40"
                value={form.location || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Ngày nhập</label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40"
              value={form.date_added || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, date_added: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Ghi chú</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/40"
              value={form.note || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, note: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border">
            Hủy
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-2"
          >
            <Check size={16} /> Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
