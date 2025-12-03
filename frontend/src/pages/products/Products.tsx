import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Edit3, X } from "lucide-react";

const API = "http://127.0.0.1:8000";

// =========================
// PRODUCT TYPE
// =========================
type Product = {
  id: number;
  name: string;
  category?: string;
  price: number;
  stock: number;
  description?: string;
  image_url?: string;

  brand?: string;
  supplier?: string;
  size?: string;
  weight?: string;
  usage?: string;
  import_date?: string;
};

// =========================
// FORM STATE TYPE
// =========================
type FormState = {
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  image: File | null;

  brand: string;
  supplier: string;
  size: string;
  weight: string;
  usage: string;
  import_date: string;
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // ⭐ LƯU TỒN KHO BAN ĐẦU
  const [originalStock, setOriginalStock] = useState<number | null>(null);

  const defaultForm: FormState = {
    name: "",
    category: "",
    price: 0,
    stock: 0,
    description: "",
    image: null,
    brand: "",
    supplier: "",
    size: "",
    weight: "",
    usage: "",
    import_date: "",
  };

  const [form, setForm] = useState<FormState>(defaultForm);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const previewUrl = useMemo(
    () => (form.image ? URL.createObjectURL(form.image) : null),
    [form.image]
  );

  // =========================
  // LOAD PRODUCTS
  // =========================
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
    setForm(defaultForm);
    setOriginalStock(null);
    setCurrentImageUrl(null);
    setEditingId(null);
  };

  // =========================
  // OPEN CREATE
  // =========================
  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  // =========================
  // OPEN EDIT
  // =========================
  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      category: p.category || "",
      price: p.price,
      stock: p.stock,
      description: p.description || "",
      image: null,

      brand: p.brand || "",
      supplier: p.supplier || "",
      size: p.size || "",
      weight: p.weight || "",
      usage: p.usage || "",
      import_date: p.import_date || "",
    });

    setOriginalStock(p.stock); // ⭐ LƯU STOCK CŨ
    setCurrentImageUrl(p.image_url ? `${API}${p.image_url}` : null);
    setEditingId(p.id);
    setOpen(true);
  };

  // =========================
  // SUBMIT FORM
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ⭐ CHẶN CHỈNH TỒN KHO TRONG EDIT
    if (editingId && originalStock !== null && form.stock !== originalStock) {
      alert(
        "⚠️ Không thể chỉnh tồn kho trong màn Sản phẩm.\nVui lòng vào mục 'Quản lý Kho hàng → Nhập kho' để cập nhật số lượng."
      );
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key !== "image") fd.append(key, String(value));
    });
    if (form.image) fd.append("image", form.image);

    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${API}/products/${editingId}`
      : `${API}/products/`;

    const res = await fetch(url, { method, body: fd });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      alert(json?.detail || "Không thể lưu sản phẩm");
      return;
    }

    await loadProducts();
    setOpen(false);
    resetForm();
  };

  // =========================
  // DELETE PRODUCT
  // =========================
  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    await fetch(`${API}/products/${id}`, { method: "DELETE" });
    loadProducts();
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Quản lý Sản phẩm</h1>

        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> Thêm sản phẩm
        </button>
      </div>

      {/* TABLE */}
      {!loading && (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Ảnh</th>
                <th className="px-3 py-2 text-left">Tên</th>
                <th className="px-3 py-2 text-left">Loại</th>
                <th className="px-3 py-2 text-left">Thương hiệu</th>
                <th className="px-3 py-2 text-left">Giá</th>
                <th className="px-3 py-2 text-left">Tồn kho</th>
                <th className="px-3 py-2 text-left">Nhà cung cấp</th>
                <th className="px-3 py-2 text-left">Mô tả</th>
                <th className="px-3 py-2 text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2">
                    {p.image_url ? (
                      <img
                        src={`${API}${p.image_url}`}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">{p.category}</td>
                  <td className="px-3 py-2">{p.brand || "-"}</td>

                  <td className="px-3 py-2">
                    {p.price.toLocaleString("vi-VN")}₫
                  </td>

                  <td className="px-3 py-2 font-semibold">
                    <span
                      className={
                        p.stock <= 0
                          ? "text-red-600"
                          : p.stock < 5
                          ? "text-orange-500"
                          : "text-green-600"
                      }
                    >
                      {p.stock}
                    </span>
                  </td>

                  <td className="px-3 py-2">{p.supplier || "-"}</td>

                  <td className="px-3 py-2 text-slate-500 truncate max-w-[160px]">
                    {p.description || "-"}
                  </td>

                  <td className="px-3 py-2 text-center flex gap-3 justify-center">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit3 size={18} />
                    </button>

                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {products.length === 0 && (
              <tbody>
                <tr>
                  <td colSpan={9} className="text-center py-6 text-slate-500">
                    Chưa có sản phẩm
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      )}

      {/* MODAL FORM */}
      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl overflow-y-auto max-h-[90vh]">
            {/* HEADER */}
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h3 className="font-semibold">
                {editingId ? "Sửa sản phẩm" : "Thêm sản phẩm"}
              </h3>

              <button
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="hover:bg-slate-200 rounded p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-2 gap-4 p-4 text-sm"
            >
              {/* TÊN */}
              <div className="col-span-2">
                <label>Tên sản phẩm</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>

              {/* LOẠI */}
              <div>
                <label>Loại</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                />
              </div>

              {/* GIÁ */}
              <div>
                <label>Giá (₫)</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: Number(e.target.value) }))
                  }
                />
              </div>

              {/* 🔥 TỒN KHO (KHÔNG CHO CHỈNH) */}
              <div>
                <label>Tồn kho</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2 bg-slate-100 cursor-not-allowed"
                  value={form.stock}
                  readOnly
                  onClick={() =>
                    alert(
                      "⚠️ Không thể chỉnh tồn kho tại đây.\nVui lòng vào 'Quản lý Kho hàng → Nhập kho' để cập nhật."
                    )
                  }
                />
                <small className="text-red-500">
                  Tồn kho chỉ cập nhật từ màn Nhập kho
                </small>
              </div>

              {/* MÔ TẢ */}
              <div className="col-span-2">
                <label>Mô tả</label>
                <textarea
                  rows={3}
                  className="w-full border rounded px-3 py-2"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>

              {/* THƯƠNG HIỆU */}
              <div>
                <label>Thương hiệu</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.brand}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, brand: e.target.value }))
                  }
                />
              </div>

              {/* NHÀ CUNG CẤP */}
              <div>
                <label>Nhà cung cấp</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.supplier}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supplier: e.target.value }))
                  }
                />
              </div>

              {/* KÍCH THƯỚC */}
              <div>
                <label>Kích thước</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.size}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, size: e.target.value }))
                  }
                />
              </div>

              {/* TRỌNG LƯỢNG */}
              <div>
                <label>Trọng lượng</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.weight}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, weight: e.target.value }))
                  }
                />
              </div>

              {/* CÔNG DỤNG */}
              <div>
                <label>Ứng dụng / Công dụng</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.usage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, usage: e.target.value }))
                  }
                />
              </div>

              {/* NGÀY NHẬP */}
              <div>
                <label>Ngày nhập</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={form.import_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, import_date: e.target.value }))
                  }
                />
              </div>

              {/* FILE ẢNH */}
              <div className="col-span-2">
                <label>Ảnh sản phẩm</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full border rounded px-3 py-2"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      image: e.target.files?.[0] ?? null,
                    }))
                  }
                />

                <div className="flex gap-3 mt-2">
                  {currentImageUrl && !previewUrl && (
                    <img
                      src={currentImageUrl}
                      className="w-20 h-20 object-cover border rounded"
                    />
                  )}

                  {previewUrl && (
                    <img
                      src={previewUrl}
                      className="w-20 h-20 object-cover border rounded"
                    />
                  )}
                </div>
              </div>

              {/* BUTTONS */}
              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-lg"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
