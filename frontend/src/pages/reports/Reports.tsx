import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, TrendingUp, Package, Warehouse, DollarSign } from "lucide-react";

const API = "http://127.0.0.1:8000";

export default function Reports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#6b7280", "#8b5cf6", "#ef4444", "#10b981"];

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`${API}/reports/summary`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("❌ Lỗi khi tải dữ liệu báo cáo:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  // Fallback để tránh lỗi hook
  const overview = data?.overview ?? { employees_count: 0, customers_count: 0, products_count: 0, total_stock: 0 };
  const inventoryData = data?.charts?.inventory ?? [];
  const entitiesData = data?.charts?.entities ?? [];
  const topProducts = data?.top_products ?? [];

  const cards = useMemo(() => [
    { label: "Nhân viên",  value: overview.employees_count, icon: <Users className="text-blue-600" /> },
    { label: "Khách hàng", value: overview.customers_count, icon: <TrendingUp className="text-green-600" /> },
    { label: "Sản phẩm",   value: overview.products_count,  icon: <Package className="text-yellow-600" /> },
    { label: "Tồn kho",    value: overview.total_stock,     icon: <Warehouse className="text-red-600" /> },
  ], [overview]);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Báo cáo tổng hợp</h1>

      {loading ? (
        <p>Đang tải dữ liệu báo cáo…</p>
      ) : !data ? (
        <p className="text-red-600">Không thể tải dữ liệu báo cáo.</p>
      ) : (
        <>
          {/* A. Cards tổng quan */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.label} className="bg-white border rounded-xl p-4 flex items-center gap-3 shadow-sm">
                {c.icon}
                <div>
                  <p className="text-sm text-slate-600">{c.label}</p>
                  <p className="text-lg font-semibold">{Number(c.value).toLocaleString("vi-VN")}</p>
                </div>
              </div>
            ))}
          </div>

          {/* B1. Biểu đồ cột */}
          <div className="bg-white p-4 border rounded-xl shadow-sm">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Warehouse size={18}/> Tồn kho theo sản phẩm
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={inventoryData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stock" fill="#2563eb" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* B2. Biểu đồ tròn */}
          <div className="bg-white p-4 border rounded-xl shadow-sm">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign size={18}/> Cơ cấu tổng thể
            </h2>
            <ResponsiveContainer width="100%" height={380}>
              <PieChart>
                <Pie
                  data={entitiesData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label
                >
                  {entitiesData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" layout="horizontal" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* C. Bảng Top sản phẩm */}
          <div className="bg-white p-4 border rounded-xl shadow-sm">
            <h2 className="font-semibold mb-3">Top 5 sản phẩm tồn kho cao nhất</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-2">Sản phẩm</th>
                    <th className="text-right px-4 py-2">Tồn kho</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length > 0 ? (
                    topProducts.map((p: any, idx: number) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2">{p.name}</td>
                        <td className="px-4 py-2 text-right">{Number(p.stock).toLocaleString("vi-VN")}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-4 py-6 text-center text-slate-500 italic">
                        Chưa có dữ liệu kho
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
