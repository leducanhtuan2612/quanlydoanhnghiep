import { useEffect, useState } from "react";
import {
  DollarSign,
  BarChart3,
  PieChart,
  Trophy,
  Users,
  TrendingUp,
} from "lucide-react";

import ChartBar from "../components/ChartBar";
import ChartPie from "../components/ChartPie";
import ChartBarHorizontal from "../components/ChartBarHorizontal";
import ChartLine from "../components/ChartLine";

const API = "http://127.0.0.1:8000";

export default function Revenue() {
  const [data, setData] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [kpi, setKpi] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ======================================================
  // 🔄 TẢI TẤT CẢ API SONG SONG
  // ======================================================
  useEffect(() => {
    async function loadAll() {
      try {
        const [revenueRes, productsRes, customersRes] = await Promise.all([
          fetch(`${API}/reports/revenue`),
          fetch(`${API}/reports/top-products`),
          fetch(`${API}/reports/top-customers`),
        ]);

        const revenue = await revenueRes.json();
        const products = await productsRes.json();
        const customers = await customersRes.json();

        setData(revenue);
        setTopProducts(products);
        setTopCustomers(customers);

        // ======================================================
        // 📌 TÍNH KPI TỔNG HỢP
        // ======================================================

        const totalOrders = customers.reduce(
          (a: number, c: any) => a + (c.order_count || 0),
          0
        );

        const totalQuantity = products.reduce(
          (a: number, p: any) => a + (p.total_sold || 0),
          0
        );

        const avgOrderValue =
          totalOrders > 0 ? revenue.total_revenue / totalOrders : 0;

        const topRegion =
          revenue.by_region.length > 0
            ? revenue.by_region.reduce((max: any, r: any) =>
                r.total > max.total ? r : max
              )
            : { region: "Không có dữ liệu", total: 0 };

        setKpi({
          totalOrders,
          totalQuantity,
          avgOrderValue,
          topRegion,
        });
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, []);

  // ======================================================
  // LOADING / ERROR
  // ======================================================
  if (loading)
    return <p className="p-6 text-gray-500">⏳ Đang tải dữ liệu báo cáo...</p>;

  if (!data)
    return (
      <p className="p-6 text-red-500">❌ Không thể tải dữ liệu doanh thu.</p>
    );

  const total = data.total_revenue?.toLocaleString("vi-VN") || "0";

  // ======================================================
  // UI
  // ======================================================
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold flex items-center gap-2 text-gray-800">
            <DollarSign className="text-blue-600" />
            Báo cáo doanh thu
          </h1>
          <span className="text-gray-500">Tổng doanh thu: ₫{total}</span>
        </div>

        {/* ======= NÚT XUẤT FILE ======= */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => window.open(`${API}/reports/export/excel`, "_blank")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
          >
            📤 Xuất Excel
          </button>

          <button
            onClick={() => window.open(`${API}/reports/export/pdf`, "_blank")}
            className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700"
          >
            📄 Xuất PDF
          </button>
        </div>
      </div>

      {/* ======================================================
         KPI DASHBOARD
      ======================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="bg-white p-4 rounded-xl shadow border">
          <p className="text-gray-500 text-sm">Tổng đơn hoàn thành</p>
          <p className="text-2xl font-bold">{kpi?.totalOrders}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border">
          <p className="text-gray-500 text-sm">Tổng SP đã bán</p>
          <p className="text-2xl font-bold">{kpi?.totalQuantity}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border">
          <p className="text-gray-500 text-sm">Giá trị trung bình / đơn</p>
          <p className="text-2xl font-bold">
            ₫{kpi?.avgOrderValue.toLocaleString("vi-VN")}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border">
          <p className="text-gray-500 text-sm">Khu vực mạnh nhất</p>
          <p className="text-xl font-semibold">{kpi?.topRegion.region}</p>
          <p className="text-green-600 text-sm">
            ₫{kpi?.topRegion.total.toLocaleString("vi-VN")}
          </p>
        </div>
      </div>

      {/* ======================================================
         BIỂU ĐỒ TUẦN – LINE CHART
      ======================================================= */}
      <div className="bg-white p-5 rounded-xl shadow-sm border">
        <h2 className="font-semibold flex items-center gap-2 mb-3 text-gray-700">
          <TrendingUp className="text-purple-600" />
          Doanh thu theo tuần (Line Chart)
        </h2>

        <ChartLine
          data={data.by_month.map((m: any) => ({
            name: `T${m.month}`,
            value: m.total,
          }))}
        />
      </div>

      {/* ======================================================
         DOANH THU THEO THÁNG
      ======================================================= */}
      <div className="bg-white p-5 rounded-xl shadow-sm border">
        <h2 className="font-semibold flex items-center gap-2 mb-3 text-gray-700">
          <BarChart3 className="text-blue-600" />
          Doanh thu theo tháng
        </h2>
        <ChartBar
          data={data.by_month.map((item: any) => ({
            name: `Thg ${item.month}`,
            value: item.total,
          }))}
        />
      </div>

      {/* ======================================================
         DOANH THU THEO DANH MỤC – PIE CHART
      ======================================================= */}
      <div className="bg-white p-5 rounded-xl shadow-sm border">
        <h2 className="font-semibold flex items-center gap-2 mb-3 text-gray-700">
          <PieChart className="text-green-600" />
          Doanh thu theo danh mục sản phẩm
        </h2>

        <ChartPie
          data={data.by_category.map((c: any) => ({
            name: c.category,
            value: c.total,
          }))}
        />
      </div>

      {/* ======================================================
         DOANH THU THEO KHU VỰC – BAR HORIZONTAL
      ======================================================= */}
      <div className="bg-white p-5 rounded-xl shadow-sm border">
        <h2 className="font-semibold text-gray-700 mb-4">
          Doanh thu theo khu vực
        </h2>

        <ChartBarHorizontal
          data={data.by_region.map((r: any) => ({
            name: r.region,
            value: r.total,
          }))}
        />
      </div>

      {/* ======================================================
         TOP SẢN PHẨM
      ======================================================= */}
      <div className="bg-white p-5 rounded-xl shadow-sm border">
        <h2 className="font-semibold flex items-center gap-2 mb-3 text-gray-700">
          <Trophy className="text-yellow-500" />
          Top sản phẩm bán chạy
        </h2>

      <table className="w-full text-sm">
  <thead>
    <tr className="border-b bg-gray-50">
      <th className="py-2 px-4 text-left">Sản phẩm</th>
      <th className="py-2 px-4 text-center">Số lượng</th>
      <th className="py-2 px-4 text-right">Doanh thu</th>
    </tr>
  </thead>
  <tbody>
    {topProducts.map((p, index) => (
      <tr key={index} className="border-b">
        <td className="py-2 px-4 text-left">{p.product}</td>
        <td className="py-2 px-4 text-center">{p.total_sold}</td>
        <td className="py-2 px-4 text-right">
          ₫{p.revenue.toLocaleString("vi-VN")}
        </td>
      </tr>
    ))}
  </tbody>
</table>

      </div>

      {/* ======================================================
         TOP KHÁCH HÀNG
      ======================================================= */}
      <div className="bg-white p-5 rounded-xl shadow-sm border">
        <h2 className="font-semibold flex items-center gap-2 mb-3 text-gray-700">
          <Users className="text-purple-600" />
          Top khách hàng mua nhiều nhất
        </h2>

       <table className="w-full text-sm">
  <thead>
    <tr className="border-b bg-gray-50">
      <th className="py-2 px-4 text-left">Khách hàng</th>
      <th className="py-2 px-4 text-center">Số đơn</th>
      <th className="py-2 px-4 text-right">Tổng chi tiêu</th>
    </tr>
  </thead>
  <tbody>
    {topProducts.map((p, index) => (
      <tr key={index} className="border-b">
        <td className="py-2 px-4 text-left">{p.product}</td>
        <td className="py-2 px-4 text-center">{p.total_sold}</td>
        <td className="py-2 px-4 text-right">
          ₫{p.revenue.toLocaleString("vi-VN")}
        </td>
      </tr>
    ))}
  </tbody>
</table>

      </div>

    </div>
  );
}
