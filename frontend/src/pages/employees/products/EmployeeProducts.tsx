// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Search, AlertTriangle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

export default function EmployeeProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // 🎯 STATE CHO MODAL
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // tải dữ liệu
  useEffect(() => {
    async function load() {
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      setProducts(data);
      setLoading(false);
    }
    load();
  }, []);

  // lọc
  const filtered = useMemo(
    () =>
      products.filter((p) =>
        `${p.name} ${p.category} ${p.description}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [products, search]
  );

  if (loading) return <div className="p-6">⏳ Đang tải dữ liệu...</div>;

  // =====================================================
  // ⭐ MODAL XEM CHI TIẾT
  // =====================================================
 const DetailModal = () =>
  selectedProduct && (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl p-6 relative animate-fadeIn">

        {/* nút đóng */}
        <button
          onClick={() => setOpenDetail(false)}
          className="absolute top-3 right-3 p-2 hover:bg-slate-100 rounded-full"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ảnh lớn */}
          <div className="w-full h-72 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center border">
            {selectedProduct.image_url ? (
              <img
                src={`${API}${selectedProduct.image_url}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-slate-400">Không có ảnh</span>
            )}
          </div>

          {/* THÔNG TIN CHI TIẾT */}
          <div className="space-y-2">

            <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>

            {/* giá */}
            <p className="text-lg">
              Giá:{" "}
              <span className="text-blue-600 font-semibold">
                {selectedProduct.price.toLocaleString("vi-VN")}₫
              </span>
            </p>

            {/* loại */}
            <p className="text-sm text-slate-700">
              <strong>Loại:</strong> {selectedProduct.category || "Không có"}
            </p>

            {/* tồn kho */}
            <p className="text-sm">
              <strong>Tồn kho:</strong>{" "}
              <span
                className={
                  selectedProduct.stock <= 5
                    ? "text-red-600 font-semibold"
                    : "text-green-600 font-semibold"
                }
              >
                {selectedProduct.stock}
              </span>

              {selectedProduct.stock <= 5 && (
                <span className="inline-flex items-center gap-1 ml-2 text-red-600 text-xs">
                  <AlertTriangle size={14} /> Sắp hết
                </span>
              )}
            </p>

            {/* Mô tả */}
            <div className="mt-3 text-sm text-slate-700">
              <strong className="block mb-1">Mô tả:</strong>
              <p className="leading-relaxed">
                {selectedProduct.description || "Không có mô tả"}
              </p>
            </div>

            {/* THUỘC TÍNH NÂNG CAO (hiển thị nếu có) */}
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-slate-700">
              <p>
                <strong>Thương hiệu:</strong>{" "}
                {selectedProduct.brand || "Không rõ"}
              </p>

              <p>
                <strong>Nhà cung cấp:</strong>{" "}
                {selectedProduct.supplier || "Không rõ"}
              </p>

              <p>
                <strong>Kích thước:</strong>{" "}
                {selectedProduct.size || "Không có"}
              </p>

              <p>
                <strong>Trọng lượng:</strong>{" "}
                {selectedProduct.weight || "Không có"}
              </p>

              <p>
                <strong>Ngày nhập:</strong>{" "}
                {selectedProduct.import_date || "Không có"}
              </p>

              <p>
                <strong>Ứng dụng:</strong>{" "}
                {selectedProduct.usage || "Không có"}
              </p>
            </div>

            {/* nút */}
            <button
              onClick={() =>
                navigate("/orders/new", {
                  state: {
                    product_id: selectedProduct.id,
                    product_name: selectedProduct.name,
                    price: selectedProduct.price,
                    stock: selectedProduct.stock,
                    category: selectedProduct.category,
                  },
                })
              }
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Tạo đơn hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );


  // =====================================================
  // ⭐ GIAO DIỆN CHÍNH
  // =====================================================
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Sản phẩm trong kho</h1>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            className="border rounded-lg pl-9 pr-3 py-2 w-72 text-sm"
            placeholder="Tìm theo tên, loại, mô tả..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((p) => (
          <div
            key={p.id}
            onClick={() => {
              setSelectedProduct(p);
              setOpenDetail(true);
            }}
            className="bg-white border rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col cursor-pointer"
          >
            {/* Ảnh */}
            <div className="w-full h-40 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
              {p.image_url ? (
                <img
                  src={`${API}${p.image_url}`}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-400">Không có ảnh</span>
              )}
            </div>

            {/* Nội dung */}
            <div className="mt-4 space-y-1 flex-1">
              <h3 className="font-semibold text-lg">{p.name}</h3>

              <p className="text-sm text-slate-600">
                Loại: <span className="font-medium">{p.category || "-"}</span>
              </p>

              <p className="text-sm">
                Giá:{" "}
                <span className="font-medium text-blue-600">
                  {p.price.toLocaleString("vi-VN")}₫
                </span>
              </p>

              <p className="text-sm font-medium">
                Tồn kho:{" "}
                <span className={p.stock <= 5 ? "text-red-600" : "text-green-600"}>
                  {p.stock}
                </span>
              </p>

              <p className="text-sm text-slate-500 line-clamp-2">
                {p.description || "Không có mô tả"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-slate-500 italic py-10">
          Không tìm thấy sản phẩm phù hợp
        </p>
      )}

      {/* 👇 MODAL xem chi tiết */}
      {openDetail && <DetailModal />}
    </div>
  );
}
