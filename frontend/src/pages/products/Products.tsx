import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Edit3, X } from "lucide-react";

const API = "http://127.0.0.1:8000";

type Product = {
  id: number;
  name: string;
  category?: string;
  price: number;
  stock: number;
  description?: string;
  image_url?: string;
};

type FormState = {
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  image: File | null;
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState<FormState>({
    name: "",
    category: "",
    price: 0,
    stock: 0,
    description: "",
    image: null,
  });

  // Ảnh hiện tại (khi sửa) & xem trước ảnh mới
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const previewUrl = useMemo(
    () => (form.image ? URL.createObjectURL(form.image) : null),
    [form.image]
  );

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const res = await fetch(`${API}/products/`);
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "",
      price: 0,
      stock: 0,
      description: "",
      image: null,
    });
    setCurrentImageUrl(null);
    setEditingId(null);
  };

  // Mở modal tạo mới
  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  // Mở modal sửa
  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      category: p.category || "",
      price: p.price,
      stock: p.stock,
      description: p.description || "",
      image: null, // để trống -> giữ ảnh cũ nếu không upload mới
    });
    setCurrentImageUrl(p.image_url ? `${API}${p.image_url}` : null);
    setEditingId(p.id);
    setOpen(true);
  };

  // Tạo hoặc cập nhật
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("category", form.category);
    fd.append("price", String(form.price));
    fd.append("stock", String(form.stock));
    fd.append("description", form.description);
    if (form.image) fd.append("image", form.image);

    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${API}/products/${editingId}`
      : `${API}/products/`;

    const res = await fetch(url, { method, body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(`Lỗi: ${err.detail || "Không thể lưu sản phẩm"}`);
      return;
    }
    await loadProducts();
    setOpen(false);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    const res = await fetch(`${API}/products/${id}`, { method: "DELETE" });
    if (res.ok) loadProducts();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Quản lý Sản phẩm</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> Thêm sản phẩm
        </button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-3 py-2">Ảnh</th>
                <th className="text-left px-3 py-2">Tên sản phẩm</th>
                <th className="text-left px-3 py-2">Loại</th>
                <th className="text-left px-3 py-2">Giá</th>
                <th className="text-left px-3 py-2">Tồn kho</th>
                <th className="text-left px-3 py-2">Mô tả</th>
                <th className="text-center px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2">
                    {p.image_url ? (
                      <img
                        src={`${API}${p.image_url}`}
                        alt={p.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <span className="text-slate-400">Không có</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">{p.category || "-"}</td>
                  <td className="px-3 py-2">
                    {p.price.toLocaleString("vi-VN")}₫
                  </td>
                  <td className="px-3 py-2">{p.stock}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {p.description || "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3 justify-center">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Sửa"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center text-slate-500 py-6 italic"
                  >
                    Chưa có sản phẩm
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal tạo/sửa */}
      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold">
                {editingId ? "Sửa sản phẩm" : "Thêm sản phẩm"}
              </h3>
              <button
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm mb-1">Tên sản phẩm</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Loại</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Tồn kho</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.stock}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        stock: Number(e.target.value),
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Giá (₫)</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        price: Number(e.target.value),
                      }))
                    }
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm mb-1">Mô tả</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2"
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm mb-1">Ảnh sản phẩm</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        image: e.target.files?.[0] ?? null,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                  <div className="flex gap-4 mt-2">
                    {currentImageUrl && !previewUrl && (
                      <img
                        src={currentImageUrl}
                        alt="current"
                        className="w-20 h-20 object-cover rounded border"
                      />
                    )}
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="preview"
                        className="w-20 h-20 object-cover rounded border"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                  className="px-3 py-2 rounded-lg border"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editingId ? "Cập nhật" : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
