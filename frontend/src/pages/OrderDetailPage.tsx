import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

type OrderItem = {
  product_name: string;
  quantity: number;
  price: number;
};

type OrderDetail = {
  id: number;
  customer_name: string;
  date: string;
  status: string;
  amount: number;
  items: OrderItem[];
};

const statusStyle = (status: string) => {
  switch (status) {
    case "Hoàn thành":
      return "bg-green-100 text-green-700 border-green-300";
    case "Đã hủy":
      return "bg-red-100 text-red-700 border-red-300";
    case "Suất xưởng":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    default:
      return "bg-blue-100 text-blue-700 border-blue-300";
  }
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/orders/${id}`)
      .then((res) => res.json())
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return <p className="p-6 text-slate-500">⏳ Đang tải dữ liệu đơn hàng...</p>;

  if (!order)
    return <p className="p-6 text-red-600">❌ Không tìm thấy đơn hàng</p>;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500">
        <Link to="/orders" className="hover:underline text-blue-600">
          Đơn hàng
        </Link>{" "}
        / Chi tiết đơn #{order.id}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">
          📄 Chi tiết đơn hàng #{order.id}
        </h2>

        <span
          className={`px-4 py-1 rounded-full border text-sm font-medium ${statusStyle(
            order.status
          )}`}
        >
          {order.status}
        </span>
      </div>

      {/* Thông tin đơn hàng */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-slate-500">Khách hàng</p>
          <p className="font-medium">{order.customer_name}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-slate-500">Ngày đặt</p>
          <p className="font-medium">{order.date}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-slate-500">Số sản phẩm</p>
          <p className="font-medium">{order.items.length}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
          <p className="text-sm text-slate-500">Tổng tiền</p>
          <p className="text-xl font-semibold text-blue-600">
            ₫{(order.amount ?? 0).toLocaleString("vi-VN")}
          </p>
        </div>
      </div>

      {/* Xuất file */}
      <div className="flex gap-3">
        <a
          href={`http://127.0.0.1:8000/orders/${order.id}/export/pdf`}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          📄 Xuất PDF
        </a>
        <a
          href={`http://127.0.0.1:8000/orders/${order.id}/export/excel`}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          📊 Xuất Excel
        </a>
      </div>

      {/* Bảng sản phẩm */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3 text-left">Sản phẩm</th>
              <th className="p-3 text-center">Số lượng</th>
              <th className="p-3 text-right">Đơn giá</th>
              <th className="p-3 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i, idx) => (
              <tr key={idx} className="border-t hover:bg-slate-50">
                <td className="p-3 font-medium">{i.product_name}</td>
                <td className="p-3 text-center">{i.quantity}</td>
                <td className="p-3 text-right">
                  ₫{i.price.toLocaleString("vi-VN")}
                </td>
                <td className="p-3 text-right font-medium">
                  ₫{(i.price * i.quantity).toLocaleString("vi-VN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-slate-500">
        <Link to="/orders" className="hover:underline text-blue-600">
          ← Quay lại danh sách đơn hàng
        </Link>

        <span>Hệ thống Quản lý Doanh nghiệp – Tuấn ERP</span>
      </div>
    </div>
  );
}
