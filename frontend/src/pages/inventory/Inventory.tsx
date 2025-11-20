import { useEffect, useState } from "react";
import { Pencil, Trash2, X, Check } from "lucide-react";

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

  // 🔎 State tìm kiếm
  const [search, setSearch] = useState("");

  // 🔹 Load dữ liệu
  useEffect(() => {
    async function load() {
      const [invRes, prodRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/inventory"),
        fetch("http://127.0.0.1:8000/products"),
      ]);

      const [invData, prodData] = await Promise.all([
        invRes.json(),
        prodRes.json(),
      ]);

      setItems(invData);
      setProducts(prodData);
      setLoading(false);
    }

    load();
  }, []);

  // 🔹 Lưu dữ liệu
  const saveItem = async (
    data: Omit<Inventory, "id" | "product_name">,
    id?: number
  ) => {
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
        setItems((prev) => prev.map((p) => (p.id === id ? result : p)));
      } else {
        setItems((prev) => [result, ...prev]);
      }
      setOpen(false);
      setEditing(null);
    } else {
      alert(result.detail || "Lỗi khi lưu");
    }
  };

  // 🔹 Xóa
  const deleteItem = async (id: number) => {
    if (!confirm("Bạn chắc muốn xóa?")) return;
    await fetch(`http://127.0.0.1:8000/inventory/${id}`, {
      method: "DELETE",
    });
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  // 🔍 lọc theo tìm kiếm
  const filtered = items.filter((i) =>
    `${i.product_name} ${i.location} ${i.note}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) return <p>⏳ Đang tải dữ liệu…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Quản lý Kho hàng</h1>

      {/* 🔎 Ô tìm kiếm */}
      <div className="flex justify-start">
        <input
          type="text"
          className="border px-3 py-2 rounded-lg w-72"
          placeholder="Tìm theo tên, vị trí, ghi chú..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left">Tên sản phẩm</th>
              <th className="px-4 py-2 text-left">Số lượng</th>
              <th className="px-4 py-2 text-left">Vị trí</th>
              <th className="px-4 py-2 text-left">Ngày nhập</th>
              <th className="px-4 py-2 text-left">Ghi chú</th>
              <th className="px-4 py-2 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="px-4 py-2">{i.product_name}</td>
                  <td className="px-4 py-2">{i.quantity}</td>
                  <td className="px-4 py-2">{i.location || "-"}</td>
                  <td className="px-4 py-2">
                    {i.date_added
                      ? new Date(i.date_added).toLocaleDateString("vi-VN")
                      : "-"}
                  </td>
                  <td className="px-4 py-2">{i.note || "-"}</td>

                  <td className="px-4 py-2 space-x-2 text-right">
                    <button
                      onClick={() => {
                        setEditing(i);
                        setOpen(true);
                      }}
                      className="px-2 py-1 border rounded hover:bg-slate-50 inline-flex gap-1"
                    >
                      <Pencil size={14} /> Sửa
                    </button>

                    <button
                      onClick={() => deleteItem(i.id)}
                      className="px-2 py-1 border rounded text-red-600 hover:bg-red-50 inline-flex gap-1"
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="py-4 text-center italic text-slate-500"
                >
                  Không tìm thấy dữ liệu phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
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
onSave={(data: any) =>
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

function InventoryModal({ initial, onClose, onSave, products }: any) {
  const [form, setForm] = useState(initial);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-center p-4 items-center">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="p-4 border-b flex justify-between">
          <h3 className="font-semibold">
            {initial.id ? "Sửa hàng hóa" : "Thêm hàng mới"}
          </h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-sm">Sản phẩm</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.product_id}
              onChange={(e) =>
                setForm({ ...form, product_id: parseInt(e.target.value) })
              }
            >
              <option value={0}>-- Chọn sản phẩm --</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Số lượng</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: parseInt(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="text-sm">Vị trí</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.location || ""}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm">Ngày nhập</label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2"
              value={form.date_added || ""}
              onChange={(e) =>
                setForm({ ...form, date_added: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm">Ghi chú</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2"
              value={form.note || ""}
              onChange={(e) =>
                setForm({ ...form, note: e.target.value })
              }
            />
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 border rounded-lg">
            Hủy
          </button>

          <button
            onClick={() => onSave(form)}
            className="px-3 py-2 bg-blue-600 rounded-lg text-white"
          >
            <Check size={16} /> Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
