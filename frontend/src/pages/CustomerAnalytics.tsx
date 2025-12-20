import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Calendar,
  ShoppingBag,
  Clock,
  Activity,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

// =======================
// TYPES
// =======================
type Customer = {
  id: number;
  name: string;
  email: string | null;
  phone?: string | null;
  address?: string | null;
};

type Stats = {
  total_spent: number;
  total_orders: number;
  last_order_date: string | null;
  avg_buy_freq: number | null;
  value_score: number;
};

type OrderItem = {
  id: number;
  amount: number;
  date: string;
  status: string;
};

type MonthlyRevenue = {
  month: string;
  amount: number;
};

type YearlyRevenue = {
  year: string;
  amount: number;
};

type TopProduct = {
  product_name: string;
  count: number;
  category?: string | null;
};

type TopCategory = {
  name: string;
  count: number;
};

type ApiResponse = {
  customer: Customer;
  stats: Stats;
  monthly_revenue: Record<string, number>;
  yearly_revenue: Record<string, number>;
  top_products: TopProduct[];
  top_categories: Record<string, number>;
  orders: OrderItem[];
  ai_summary: string;
  error?: string;
};

// =======================
// COLORS
// =======================
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// =======================
// MAIN COMPONENT
// =======================
export default function CustomerAnalytics() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRevenue[]>([]);
  const [yearly, setYearly] = useState<YearlyRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [aiSummary, setAiSummary] = useState("");

  useEffect(() => {
    if (!id) return;
    loadData(id);
  }, [id]);

  const loadData = async (cid: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/analysis/customers/${cid}`);
      const data: ApiResponse = await res.json();

      if (!res.ok || (data as any).error) {
        setError(data.error || "Không thể phân tích khách hàng này");
        setLoading(false);
        return;
      }

      setCustomer(data.customer);
      setStats(data.stats);

      const m = Object.entries(data.monthly_revenue || {}).map(([k, v]) => ({
        month: k,
        amount: Number(v),
      }));
      m.sort((a, b) => (a.month > b.month ? 1 : -1));
      setMonthly(m);

      const y = Object.entries(data.yearly_revenue || {}).map(([k, v]) => ({
        year: k,
        amount: Number(v),
      }));
      y.sort((a, b) => (a.year > b.year ? 1 : -1));
      setYearly(y);

      setTopProducts(data.top_products || []);

      const catArr: TopCategory[] = Object.entries(data.top_categories || {}).map(
        ([name, count]) => ({
          name,
          count: Number(count),
        })
      );
      setTopCategories(catArr);

      setOrders(data.orders || []);
      setAiSummary(data.ai_summary || "");
    } catch (e) {
      setError("Có lỗi khi tải dữ liệu phân tích");
    } finally {
      setLoading(false);
    }
  };

  // =======================
  // DERIVED DATA
  // =======================
  const avgOrderValue = useMemo(() => {
    if (!stats || !stats.total_orders) return 0;
    return stats.total_spent / stats.total_orders;
  }, [stats]);

  const statusStats = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      map[o.status] = (map[o.status] || 0) + 1;
    });

    return Object.entries(map).map(([status, value]) => ({
      status,
      value,
    }));
  }, [orders]);

  const lastOrderDateStr = useMemo(() => {
    if (!stats?.last_order_date) return "Chưa có";
    return new Date(stats.last_order_date).toLocaleDateString("vi-VN");
  }, [stats]);

  const segmentLabel = useMemo(() => {
    if (!stats) return "";
    if (stats.value_score > 8) return "VIP";
    if (stats.value_score > 5) return "Tiềm năng";
    return "Cơ bản";
  }, [stats]);

  const segmentColor = useMemo(() => {
    if (!stats) return "bg-slate-400";
    if (stats.value_score > 8) return "bg-yellow-400";
    if (stats.value_score > 5) return "bg-sky-400";
    return "bg-slate-400";
  }, [stats]);

  // Format AI summary: xuống dòng theo \n
  const formattedAiSummary = useMemo(() => {
    if (!aiSummary) return [];
    return aiSummary.trim().split("\n").filter((line) => line.trim() !== "");
  }, [aiSummary]);

  // =======================
  // RENDER
  // =======================
  if (loading) return <p className="p-4">Đang tải dữ liệu phân tích...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;
  if (!customer || !stats) return <p className="p-4">Không tìm thấy khách hàng</p>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/customers"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 text-sm"
            >
              <ArrowLeft size={16} />
              Quay lại danh sách
            </Link>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Phân tích khách hàng
            <span className="text-slate-500 text-base">#{customer.id}</span>
          </h1>
          <p className="text-slate-500">
            Dữ liệu hành vi – doanh thu – sản phẩm ưa thích – phân tích AI
          </p>
        </div>

        <div className="text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                segmentColor === "bg-yellow-400"
                  ? "bg-yellow-400"
                  : segmentColor === "bg-sky-400"
                  ? "bg-sky-400"
                  : "bg-slate-400"
              }`}
            />
            <span className="text-xs uppercase tracking-wide text-slate-600">
              Nhóm khách hàng:
            </span>
            <span className="font-semibold text-slate-800">{segmentLabel}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Điểm giá trị:{" "}
            <span className="font-semibold text-purple-600">{stats.value_score}</span>
          </div>
        </div>
      </div>

      {/* TOP SECTION: PROFILE + AI SUMMARY */}
      <div className="grid grid-cols-12 gap-4">
        {/* Hồ sơ */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
         <div className="bg-white shadow-sm border rounded-xl p-4 h-full flex flex-col">

            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                {customer.name?.charAt(0)?.toUpperCase() || "C"}
              </div>
              <div>
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  {customer.name}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    ID: {customer.id}
                  </span>
                </h2>
                <p className="text-sm text-slate-500">Hồ sơ chi tiết khách hàng</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-1">Email</p>
                <p className="font-medium">{customer.email || "—"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Số điện thoại</p>
                <p className="font-medium">{customer.phone || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500 text-xs mb-1">Địa chỉ</p>
                <p className="font-medium">{customer.address || "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6 text-center text-xs">
              <StatChip
                label="Tổng chi tiêu"
                value={`₫${stats.total_spent.toLocaleString("vi-VN")}`}
                icon={<TrendingUp size={16} />}
                color="text-blue-600"
              />
              <StatChip
                label="Số đơn hàng"
                value={stats.total_orders}
                icon={<ShoppingBag size={16} />}
                color="text-emerald-600"
              />
              <StatChip
                label="Giá trị trung bình/đơn"
                value={`₫${avgOrderValue.toLocaleString("vi-VN")}`}
                icon={<Activity size={16} />}
                color="text-purple-600"
              />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-500" />
                <div>
                  <p className="text-slate-500 text-[11px] uppercase">
                    Lần mua gần nhất
                  </p>
                  <p className="font-medium text-slate-800">{lastOrderDateStr}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-500" />
                <div>
                  <p className="text-slate-500 text-[11px] uppercase">
                    Tần suất mua trung bình
                  </p>
                    <p className="font-medium text-slate-800">
                    {stats.avg_buy_freq
                        ? `${stats.avg_buy_freq.toFixed(1)} ngày/lần`
                        : "Chưa đủ dữ liệu"}
                    </p>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI SUMMARY */}
        <div className="col-span-12 lg:col-span-7">
    <div className="bg-white shadow-sm border rounded-xl p-4 h-full flex flex-col">

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="text-purple-500" size={18} />
                <h2 className="font-semibold text-base">AI Summary – Tổng quan khách hàng</h2>
              </div>
            </div>
            {formattedAiSummary.length === 0 ? (
              <p className="text-sm text-slate-500">
                Chưa có mô tả AI cho khách hàng này.
              </p>
            ) : (
              <div className="text-sm text-slate-800 space-y-1 leading-relaxed">
                {formattedAiSummary.map((line, idx) => (
                  <p key={idx}>
                    {line.startsWith("-") || line.startsWith("–") ? (
                      <span className="inline-flex gap-1">
                        <span className="mt-[6px] w-1 h-1 rounded-full bg-slate-400" />
                        <span>{line.replace(/^[-–]\s*/, "")}</span>
                      </span>
                    ) : (
                      line
                    )}
                  </p>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-dashed border-slate-200 text-xs text-slate-500">
              Gợi ý: Dùng thông tin này để cá nhân hóa email, khuyến mãi và chăm sóc khách
              hàng.
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: CHARTS */}
      <div className="grid grid-cols-12 gap-4">
        {/* Doanh thu theo tháng */}
        <div className="col-span-12 xl:col-span-7">
          <div className="bg-white shadow-sm border rounded-xl p-4 h-full">
            <h3 className="font-semibold mb-1">Doanh thu theo tháng</h3>
            <p className="text-xs text-slate-500 mb-3">
              Xem dòng tiền đến từ khách hàng này theo từng tháng
            </p>
            {monthly.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu doanh thu theo tháng.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthly}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) =>
                      `₫${Number(value).toLocaleString("vi-VN")}`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Doanh thu theo năm */}
        <div className="col-span-12 xl:col-span-5">
          <div className="bg-white shadow-sm border rounded-xl p-4 h-full">
            <h3 className="font-semibold mb-1">Doanh thu theo năm</h3>
            <p className="text-xs text-slate-500 mb-3">
              Tổng doanh thu mỗi năm mà khách đóng góp
            </p>
            {yearly.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu doanh thu theo năm.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={yearly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) =>
                      `₫${Number(value).toLocaleString("vi-VN")}`
                    }
                  />
                  <Bar dataKey="amount" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: TOP PRODUCTS / CATEGORIES / STATUS */}
      <div className="grid grid-cols-12 gap-4">
        {/* Top sản phẩm */}
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <div className="bg-white shadow-sm border rounded-xl p-4 h-full">
            <h3 className="font-semibold mb-1">Sản phẩm mua nhiều nhất</h3>
            <p className="text-xs text-slate-500 mb-3">
              Danh sách các sản phẩm được khách chọn mua nhiều lần
            </p>
            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu sản phẩm.</p>
            ) : (
              <div className="flex gap-4">
                <div className="w-1/2">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={topProducts}
                        dataKey="count"
                        nameKey="product_name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label
                      >
                        {topProducts.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 text-xs space-y-2">
                  {topProducts.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium text-slate-800">
                          {p.product_name || "Không xác định"}
                        </p>
                        <p className="text-slate-500">
                          {p.count} lượt mua
                          {p.category ? ` • ${p.category}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top danh mục */}
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <div className="bg-white shadow-sm border rounded-xl p-4 h-full">
            <h3 className="font-semibold mb-1">Danh mục quan tâm</h3>
            <p className="text-xs text-slate-500 mb-3">
              Những nhóm sản phẩm khách hàng mua nhiều
            </p>
            {topCategories.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu danh mục.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topCategories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tình trạng đơn hàng */}
        <div className="col-span-12 xl:col-span-4">
          <div className="bg-white shadow-sm border rounded-xl p-4 h-full">
            <h3 className="font-semibold mb-1">Tình trạng đơn hàng</h3>
            <p className="text-xs text-slate-500 mb-3">
              Tỉ lệ giữa các đơn hoàn thành / chờ xử lý / đã hủy
            </p>
            {statusStats.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có đơn hàng.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#6366f1" name="Số đơn" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ORDER TABLE */}
      <div className="bg-white shadow-sm border rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="font-semibold">Lịch sử đơn hàng</h3>
            <p className="text-xs text-slate-500">
              Toàn bộ đơn hàng mà khách đã tạo trong hệ thống
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-slate-500 mt-2">Chưa có đơn hàng.</p>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full text-sm">
              <thead className="text-slate-600 bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">Mã đơn</th>
                  <th className="px-3 py-2 text-left">Ngày</th>
                  <th className="px-3 py-2 text-left">Trạng thái</th>
                  <th className="px-3 py-2 text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {orders
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map((o) => (
                    <tr key={o.id} className="border-t">
                      <td className="px-3 py-2">#{o.id}</td>
                      <td className="px-3 py-2">
                        {new Date(o.date).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-3 py-2">{o.status}</td>
                      <td className="px-3 py-2 text-right">
                        ₫{o.amount.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// =======================
// SMALL COMPONENTS
// =======================
function StatChip({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2 flex flex-col items-center justify-center">
      <div className={`flex items-center gap-1 text-xs ${color || "text-slate-600"}`}>
        {icon}
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-sm font-semibold mt-1 text-slate-900">{value}</div>
    </div>
  );
}
