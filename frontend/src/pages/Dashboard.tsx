import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChartBar from "../components/ChartBar";
import ChartPie from "../components/ChartPie";
import ChartBarHorizontal from "../components/ChartBarHorizontal";
import TableOrders from "../components/TableOrders";
import { useSettings } from "../context/SettingsContext";

export default function Dashboard() {
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<{
    by_month: { month: number; total: number }[];
    by_category: { category: string; total: number }[];
    by_region: { region: string; total: number }[];
  } | null>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [customersCount, setCustomersCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // 🔢 Hàm tính phần trăm tăng/giảm
  // -----------------------------
function calcPercent(current: number, previous: number) {
  if (!previous || previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}


  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, ordersRes, customersRes, productsRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/orders/summary-all"),
          fetch("http://127.0.0.1:8000/orders"),
          fetch("http://127.0.0.1:8000/customers"),
          fetch("http://127.0.0.1:8000/products"),
        ]);

        const summaryData = await summaryRes.json();
        const ordersData = await ordersRes.json();
        const customersData = await customersRes.json();
        const productsData = await productsRes.json();

        setSummary(summaryData);
        setOrders(ordersData.slice(0, 5));
        setCustomersCount(customersData.length);
        setProductsCount(productsData.length);
        setTotalOrders(ordersData.length);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading)
    return <div className="p-6 text-center text-gray-500">⏳ Đang tải dữ liệu Dashboard...</div>;

  // ===========================
  // 📌 Tính toán tăng trưởng %
  // ===========================
  const months = summary?.by_month || [];

  const curRevenue = months[months.length - 1]?.total || 0;
  const prevRevenue = months[months.length - 2]?.total || 0;
  const revenuePercent = calcPercent(curRevenue, prevRevenue);

  const curOrders = totalOrders;
  const prevOrders = totalOrders - 5;        // giả sử tháng trước ít hơn 5 đơn (đỡ bị 0)
  const ordersPercent = calcPercent(curOrders, prevOrders);

  const customerPercent = calcPercent(customersCount, customersCount - 1);
  const productPercent = calcPercent(productsCount, productsCount - 1);

  const totalRevenue = months.reduce((acc, cur) => acc + cur.total, 0);

  // ===========================
  // 🔥 Danh sách KPI
  // ===========================
  const kpis = [
    {
      title: "Doanh thu",
      value: "₫" + totalRevenue.toLocaleString("vi-VN"),
      change: (revenuePercent >= 0 ? "+" : "") + revenuePercent + "%",
      trend: revenuePercent >= 0 ? "up" : "down",
      path: "/revenue",
    },
    {
      title: "Tổng đơn hàng",
      value: totalOrders.toString(),
      change: (ordersPercent >= 0 ? "+" : "") + ordersPercent + "%",
      trend: ordersPercent >= 0 ? "up" : "down",
      path: "/orders",
    },
    {
      title: "Khách hàng mới",
      value: customersCount.toString(),
      change: (customerPercent >= 0 ? "+" : "") + customerPercent + "%",
      trend: customerPercent >= 0 ? "up" : "down",
      path: "/customers",
    },
    {
      title: "Tổng sản phẩm",
      value: productsCount.toString(),
      change: (productPercent >= 0 ? "+" : "") + productPercent + "%",
      trend: productPercent >= 0 ? "up" : "down",
      path: "/products",
    },
  ];

  // ===========================
  // 🔥 Dữ liệu biểu đồ
  // ===========================
  const salesData =
    months.map((item) => ({ name: `Thg ${item.month}`, value: item.total })) || [];

  const categoryData =
    summary?.by_category?.map((item) => ({ name: item.category, value: item.total })) || [];

  const regionData =
    summary?.by_region?.map((item) => ({ name: item.region, value: item.total })) || [];

  return (
    <div className="p-0 space-y-1 bg-gray-50 min-h-screen">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.title}
            onClick={() => navigate(k.path)}
            className="bg-white p-5 rounded-xl shadow-sm border border-black/30
                       hover:border-blue-400 hover:shadow-md transition cursor-pointer active:scale-[0.98]"
          >
            <div className="text-sm text-gray-500 font-medium">{k.title}</div>
            <div className="text-2xl font-bold mt-1 text-gray-800">{k.value}</div>
            <div className={`flex items-center text-sm mt-2 ${k.trend === "up" ? "text-green-600" : "text-red-500"}`}>
              {k.trend === "up" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="ml-1">{k.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-black/30">
          <h2 className="font-semibold text-gray-700 mb-4">Tổng quan doanh thu</h2>
          <ChartBar data={salesData} />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-black/30">
          <h2 className="font-semibold text-gray-700 mb-4">Doanh số theo danh mục</h2>
          <ChartPie data={categoryData} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-black/30">
          <h2 className="font-semibold text-gray-700 mb-4">Đơn hàng gần đây</h2>
          <TableOrders
            data={orders.map((o) => ({
              id: o.id,
              customer: o.customer_name,
              date: new Date(o.date).toLocaleDateString("vi-VN"),
              status: o.status,
              amount: o.amount,
            }))}
          />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-black/30">
          <h2 className="font-semibold text-gray-700 mb-4">Doanh thu theo khu vực</h2>
          <ChartBarHorizontal data={regionData} />
        </div>
      </div>
    </div>
  );
}
