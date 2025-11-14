import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateOrder() {
  const navigate = useNavigate();

  // ==============================
  // STATE
  // ==============================
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [form, setForm] = useState({
    customer_id: "",
    product_id: "",
    date: "",
    status: "Đang xử lý",
    amount: "",
    quantity: 1, // 🆕 Thêm số lượng mặc định
    category: "Khác",
    region: "Miền Bắc",
  });

  // ==============================
  // LẤY DỮ LIỆU KHÁCH HÀNG & SẢN PHẨM
  // ==============================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resCus, resPro] = await Promise.all([
          fetch("http://127.0.0.1:8000/customers"),
          fetch("http://127.0.0.1:8000/products"),
        ]);

        const customersData = await resCus.json();
        const productsData = await resPro.json();

        setCustomers(customersData);
        setProducts(productsData);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        setMessage("⚠️ Không thể tải danh sách khách hàng hoặc sản phẩm!");
      }
    };

    fetchData();
  }, []);

  // ==============================
  // XỬ LÝ FORM
  // ==============================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Nếu chọn sản phẩm → tự động lấy giá và danh mục
    if (name === "product_id") {
      const product = products.find((p) => p.id === parseInt(value));
      setSelectedProduct(product || null);

      setForm((prev) => ({
        ...prev,
        product_id: value,
        amount: product ? product.price * prev.quantity : "",
        category: product ? product.category : "Khác",
      }));
    }
    // Nếu thay đổi số lượng → cập nhật lại số tiền
    else if (name === "quantity") {
      const qty = parseInt(value) || 1;
      setForm((prev) => ({
        ...prev,
        quantity: qty,
        amount: selectedProduct ? selectedProduct.price * qty : prev.amount,
      }));
    }
    // Còn lại
    else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.customer_id || !form.product_id) {
      setMessage("⚠️ Vui lòng chọn khách hàng và sản phẩm!");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          customer_id: parseInt(form.customer_id),
          product_id: parseInt(form.product_id),
        }),
      });

      if (res.ok) {
        setMessage("✅ Đơn hàng đã được tạo thành công!");
        setTimeout(() => navigate("/orders"), 1200);
      } else {
        const errorText = await res.text();
        console.error("❌ Lỗi:", errorText);
        setMessage("❌ Không thể tạo đơn hàng. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Lỗi kết nối tới server!");
    }
  };

  // ==============================
  // GIAO DIỆN
  // ==============================
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">🛒 Tạo đơn hàng mới</h2>

      {message && (
        <div className="mb-4 text-center font-medium text-blue-700">{message}</div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-5 rounded-xl shadow border space-y-4"
      >
        {/* CHỌN KHÁCH HÀNG */}
        <div>
          <label className="block mb-1 font-medium">Khách hàng</label>
          <select
            name="customer_id"
            value={form.customer_id}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Chọn khách hàng --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </div>

        {/* CHỌN SẢN PHẨM */}
        <div>
          <label className="block mb-1 font-medium">Sản phẩm</label>
          <select
            name="product_id"
            value={form.product_id}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Chọn sản phẩm --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - {p.price.toLocaleString()}₫ (Tồn: {p.stock})
              </option>
            ))}
          </select>

          {selectedProduct && (
            <p className="text-sm text-gray-500 mt-1">
              💰 Giá: {selectedProduct.price.toLocaleString()}₫ — Tồn kho:{" "}
              {selectedProduct.stock}
            </p>
          )}
        </div>

        {/* 🆕 NHẬP SỐ LƯỢNG */}
        <div>
          <label className="block mb-1 font-medium">Số lượng</label>
          <input
            type="number"
            name="quantity"
            min="1"
            value={form.quantity}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
          {selectedProduct && (
            <p className="text-xs text-gray-500 mt-1">
              Tổng tiền tạm tính:{" "}
              <span className="font-semibold text-blue-600">
                {(selectedProduct.price * form.quantity).toLocaleString()}₫
              </span>
            </p>
          )}
        </div>

        {/* NGÀY ĐẶT HÀNG */}
        <div>
          <label className="block mb-1 font-medium">Ngày đặt hàng</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* TRẠNG THÁI */}
        <div>
          <label className="block mb-1 font-medium">Trạng thái</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option>Đang xử lý</option>
            <option>Hoàn thành</option>
            <option>Đã hủy</option>
            <option>Suất xưởng</option>
          </select>
        </div>

        {/* DANH MỤC */}
        <div>
          <label className="block mb-1 font-medium">Danh mục</label>
          <input
            type="text"
            name="category"
            value={form.category}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* KHU VỰC */}
        <div>
          <label className="block mb-1 font-medium">Khu vực</label>
          <select
            name="region"
            value={form.region}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option>Miền Bắc</option>
            <option>Miền Trung</option>
            <option>Miền Nam</option>
          </select>
        </div>

        {/* GIÁ / SỐ TIỀN */}
        <div>
          <label className="block mb-1 font-medium">Thành tiền (₫)</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* NÚT HÀNH ĐỘNG */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Lưu đơn hàng
          </button>
        </div>
      </form>
    </div>
  );
}
