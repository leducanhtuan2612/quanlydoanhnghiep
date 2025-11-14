import { useEffect, useState } from "react";
import { DollarSign, BarChart3, PieChart } from "lucide-react";
import ChartBar from "../components/ChartBar";
import ChartPie from "../components/ChartPie";
import ChartBarHorizontal from "../components/ChartBarHorizontal";

const API = "http://127.0.0.1:8000";

export default function Revenue() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Gọi đúng API doanh thu
  useEffect(() => {
    async function fetchRevenue() {
      try {
        const res = await fetch(`${API}/reports/revenue`);
        if (!res.ok) throw new Error("Lỗi tải dữ liệu doanh thu");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("❌ Lỗi khi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRevenue();
  }, []);

  if (loading)
    return <p className="p-6 text-gray-500">⏳ Đang tải dữ liệu doanh thu...</p>;
  if (!data)
    return <p className="p-6 text-red-500">Không thể tải dữ liệu doanh thu.</p>;

  const total = data.total_revenue?.toLocaleString("vi-VN") || "0";

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2 text-gray-800">
          <DollarSign className="text-blue-600" /> Báo cáo doanh thu
        </h1>
        <span className="text-gray-500">Tổng doanh thu: ₫{total}</span>
      </div>

      {/* ===== Biểu đồ doanh thu theo tháng ===== */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h2 className="font-semibold flex items-center gap-2 mb-3 text-gray-700">
          <BarChart3 className="text-blue-600" /> Doanh thu theo tháng
        </h2>
        <ChartBar
          data={
            data.by_month.map((item: any) => ({
              name: `Thg ${item.month}`,
              value: item.total,
            })) || []
          }
        />
      </div>

      {/* ===== Biểu đồ doanh thu theo danh mục ===== */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h2 className="font-semibold flex items-center gap-2 mb-3 text-gray-700">
          <PieChart className="text-green-600" /> Doanh thu theo danh mục sản phẩm
        </h2>
        <ChartPie
          data={
            data.by_category.map((c: any) => ({
              name: c.category,
              value: c.total,
            })) || []
          }
        />
      </div>

      {/* ===== Biểu đồ doanh thu theo khu vực ===== */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-4">
          Doanh thu theo khu vực
        </h2>
        <ChartBarHorizontal
          data={
            data.by_region.map((r: any) => ({
              name: r.region,
              value: r.total,
            })) || []
          }
        />
      </div>
    </div>
  );
}
