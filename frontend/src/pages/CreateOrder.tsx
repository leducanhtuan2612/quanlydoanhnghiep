// @ts-nocheck
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

  // 🔍 search state
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [form, setForm] = useState({
    customer_id: "",
    product_id: "",
    date: "",
    status: "Đang xử lý",
    amount: "",
    quantity: 1,
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
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Nếu chọn sản phẩm
    if (name === "product_id") {
      const product = products.find((p) => p.id === Number(value));
      setSelectedProduct(product || null);

      setForm((prev) => ({
        ...prev,
        product_id: value,
        amount: product ? product.price * prev.quantity : "",
        category: product ? product.category : "Khác",
      }));
    }

    // Nếu thay đổi số lượng
    else if (name === "quantity") {
      const qty = Number(value) || 1;
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

  // ==============================
  // SUBMIT
  // ==============================
  const handleSubmit = async (e) => {
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
          amount: Number(form.amount),
          customer_id: Number(form.customer_id),
          product_id: Number(form.product_id),
        }),
      });

      if (res.ok) {
        setMessage("✅ Đơn hàng đã được tạo thành công!");
        setTimeout(() => navigate("/orders"), 1200);
      } else {
        const txt = await res.text();
        console.log(txt);
        setMessage("❌ Không thể tạo đơn hàng.");
      }
    } catch {
      setMessage("⚠️ Lỗi kết nối server!");
    }
  };

  // ==============================
  // GIAO DIỆN
  // ==============================
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">🛒 Tạo đơn hàng mới</h2>

      {message && (
        <div className="mb-4 text-center font-medium text-blue-700">
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-5 rounded-xl shadow border space-y-4"
      >
        {/* 🔍 AUTOCOMPLETE KHÁCH HÀNG */}
        <div className="relative">
          <label className="block mb-1 font-medium">Khách hàng</label>

          <input
            type="text"
            placeholder="Nhập tên hoặc email..."
            value={
              form.customer_id
                ? customers.find((c) => c.id === Number(form.customer_id))?.name
                : customerSearch
            }
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setForm((f) => ({ ...f, customer_id: "" }));
            }}
            className="w-full border rounded px-3 py-2"
          />

          {customerSearch && (
            <div className="absolute z-20 bg-white border rounded w-full max-h-40 overflow-auto shadow">
              {customers
                .filter(
                  (c) =>
                    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    c.email.toLowerCase().includes(customerSearch.toLowerCase())
                )
                .map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, customer_id: String(c.id) }));
                      setCustomerSearch("");
                    }}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                  >
                    {c.name} ({c.email})
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* 🔍 AUTOCOMPLETE SẢN PHẨM */}
        <div className="relative">
          <label className="block mb-1 font-medium">Sản phẩm</label>

          <input
            type="text"
            placeholder="Nhập tên sản phẩm..."
            value={
              form.product_id
                ? products.find((p) => p.id === Number(form.product_id))?.name
                : productSearch
            }
            onChange={(e) => {
              setProductSearch(e.target.value);
              setForm((f) => ({ ...f, product_id: "" }));
            }}
            className="w-full border rounded px-3 py-2"
          />

          {productSearch && (
            <div className="absolute z-20 bg-white border rounded w-full max-h-40 overflow-auto shadow">
              {products
                .filter((p) =>
                  p.name.toLowerCase().includes(productSearch.toLowerCase())
                )
                .map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        product_id: String(p.id),
                        amount: p.price * form.quantity,
                        category: p.category,
                      }));
                      setSelectedProduct(p);
                      setProductSearch("");
                    }}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                  >
                    {p.name} — {p.price.toLocaleString()}₫ (Tồn: {p.stock})
                  </div>
                ))}
            </div>
          )}
        </div>

        {selectedProduct && (
          <p className="text-sm text-gray-500 mt-1">
            💰 Giá: {selectedProduct.price.toLocaleString()}₫ — Tồn kho:{" "}
            {selectedProduct.stock}
          </p>
        )}

        {/* SỐ LƯỢNG */}
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

        {/* THÀNH TIỀN */}
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

        {/* NÚT */}
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
