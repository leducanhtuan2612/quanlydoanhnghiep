import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Order = {
  id: number;
  customer_name: string;
  date: string;
  status: string;
  amount: number;
  category: string;
  region: string;
  quantity: number;
  product_id: number;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🧭 Hàm tải lại danh sách đơn hàng
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/orders");
      if (!res.ok) throw new Error("Không thể tải dữ liệu đơn hàng");
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🌀 Hàm thay đổi trạng thái đơn hàng
  const handleChangeStatus = async (orderId: number, newStatus: string) => {
    try {
      await fetch(
        `http://127.0.0.1:8000/orders/${orderId}/status?status=${encodeURIComponent(newStatus)}`,
        { method: "PUT" }
      );

      // ✅ Sau khi đổi trạng thái → tải lại đơn hàng & sản phẩm
      await fetchOrders();
      await fetch("http://127.0.0.1:8000/products"); // frontend sản phẩm cũng tự reload nếu bạn có state chung
    } catch (err) {
      alert("❌ Lỗi khi cập nhật trạng thái đơn hàng");
    }
  };

  return (
    <div className="p-6">
      {/* ====== Header ====== */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">📦 Danh sách đơn hàng</h2>
        <Link
          to="/orders/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Tạo đơn hàng
        </Link>
      </div>

      {/* ====== Loading / Error ====== */}
      {loading && <p>⏳ Đang tải dữ liệu...</p>}
      {error && <p className="text-red-600">⚠️ {error}</p>}

      {/* ====== Table ====== */}
      {!loading && !error && (
        <div className="overflow-x-auto bg-white border rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="p-3">Mã đơn</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Ngày</th>
                <th className="p-3">Danh mục</th>
                <th className="p-3">Khu vực</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Số tiền</th>
                <th className="p-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3 font-medium text-slate-700">{o.id}</td>
                    <td className="p-3">{o.customer_name}</td>
                    <td className="p-3">{o.date}</td>
                    <td className="p-3">{o.category}</td>
                    <td className="p-3">{o.region}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          o.status === "Hoàn thành"
                            ? "bg-green-100 text-green-700"
                            : o.status === "Đã hủy"
                            ? "bg-red-100 text-red-700"
                            : o.status === "Suất xưởng"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      ₫{o.amount.toLocaleString("vi-VN")}
                    </td>
                    <td className="p-3 text-center">
                      {/* Nút đổi trạng thái */}
                      <select
                        value={o.status}
                        onChange={(e) =>
                          handleChangeStatus(o.id, e.target.value)
                        }
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="Đang xử lý">Đang xử lý</option>
                        <option value="Suất xưởng">Suất xưởng</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                        <option value="Đã hủy">Đã hủy</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-slate-500">
                    Không có đơn hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
