import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  PackageOpen,
  BriefcaseBusiness,
  ClipboardList,
} from "lucide-react";

import ChartBar from "../../components/ChartBar";
import ChartLine from "../../components/ChartLine";
import ChartPie from "../../components/ChartPie";

const API = "http://127.0.0.1:8000";

// ===== TYPES =====
type Summary = {
  employees: number;
  active_employees: number;
  customers: number;
  inventory_low: number;
  tasks: {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
    overdue: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    canceled: number;
  };
};

type DeptItem = {
  department: string | null;
  total: number;
};

type RevenueItem = {
  month: string;
  total: number;
};

type TaskSummary = {
  todo: number;
  in_progress: number;
  done: number;
};

export default function ManagerHome() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [departments, setDepartments] = useState<DeptItem[]>([]);
  const [revenue, setRevenue] = useState<RevenueItem[]>([]);
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===============================
  // LOAD DASHBOARD DATA
  // ===============================
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
const [sRes, dRes, rRes, tRes] = await Promise.all([
  fetch(`${API}/manager/stats`),
  fetch(`${API}/manager/employees-by-department`),
  fetch(`${API}/manager/revenue-monthly`),
  fetch(`${API}/manager/task-summary`),
]);


        if (!sRes.ok || !dRes.ok || !rRes.ok || !tRes.ok)
          throw new Error("Không thể tải dữ liệu dashboard");

        const sJson = (await sRes.json()) as Summary;
        const dJson = (await dRes.json()) as DeptItem[];
        const rJson = (await rRes.json()) as RevenueItem[];
        const tJson = (await tRes.json()) as TaskSummary;

        setSummary(sJson);
        setDepartments(dJson || []);
        setRevenue(rJson || []);
        setTaskSummary(tJson);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Lỗi không xác định");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="p-6">Đang tải dữ liệu dashboard quản lý...</div>;

  if (error || !summary || !taskSummary)
    return (
      <div className="p-6 text-red-600">
        Không thể tải dashboard quản lý.{" "}
        <span className="text-sm text-gray-500">{error}</span>
      </div>
    );

  // ===============================
  // CHUẨN HÓA DATA CHART
  // ===============================
  const deptChartData = departments.map((d) => ({
    name: d.department || "Khác",
    value: d.total,
  }));

  const revenueChartData = revenue.map((r) => ({
    name: r.month,
    value: r.total,
  }));

  const taskPieData = [
    { name: "Chưa làm", value: taskSummary.todo },
    { name: "Đang làm", value: taskSummary.in_progress },
    { name: "Hoàn thành", value: taskSummary.done },
  ];

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="p-6 space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Trang chủ quản lý</h1>
          <p className="text-sm text-gray-500">
            Tổng quan nhân sự, đơn hàng, kho và công việc trong doanh nghiệp.
          </p>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Tổng nhân viên"
          value={summary.employees}
          sub={`${summary.active_employees} đang làm việc`}
        />
        <KpiCard
          icon={UserCheck}
          label="Khách hàng"
          value={summary.customers}
          sub="Khách hàng trong hệ thống"
        />
        <KpiCard
          icon={PackageOpen}
          label="Sản phẩm sắp hết"
          value={summary.inventory_low}
          sub="SKU dưới ngưỡng cảnh báo"
        />
        <KpiCard
          icon={BriefcaseBusiness}
          label="Công việc"
          value={summary.tasks.total}
          sub={`${summary.tasks.todo} đang làm • ${summary.tasks.done} hoàn thành`}
        />
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartBar title="Nhân viên theo phòng ban" data={deptChartData} />
        <ChartLine title="Doanh thu theo tháng" data={revenueChartData} />
      </div>

      {/* CHARTS + TASK SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartPie title="Trạng thái công việc" data={taskPieData} />

        {/* SUMMARY CARD */}
        <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Tổng quan công việc
            </h3>

            <ul className="space-y-1 text-sm">
              <li className="flex justify-between">
                <span>Chưa làm</span>
                <span className="font-medium">{summary.tasks.todo}</span>
              </li>
              <li className="flex justify-between">
                <span>Đang thực hiện</span>
                <span className="font-medium">{summary.tasks.in_progress}</span>
              </li>
              <li className="flex justify-between">
                <span>Hoàn thành</span>
                <span className="font-medium">{summary.tasks.done}</span>
              </li>
              <li className="flex justify-between text-red-500">
                <span>Quá hạn</span>
                <span className="font-medium">{summary.tasks.overdue}</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 text-xs text-gray-500 border-t pt-2">
            Tổng đơn hàng:{" "}
            <span className="font-medium text-gray-700">{summary.orders.total}</span>{" "}
            • Hoàn thành:{" "}
            <span className="font-medium text-green-600">
              {summary.orders.completed}
            </span>{" "}
            • Hủy:{" "}
            <span className="font-medium text-red-500">
              {summary.orders.canceled}
            </span>
          </div>
        </div>

        {/* NOTES */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-3">Ghi chú nhanh cho quản lý</h3>
          <textarea
            className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring focus:ring-indigo-100"
            rows={6}
            placeholder="Ví dụ: kiểm tra tồn kho nhóm A, duyệt hợp đồng mới..."
          />
        </div>
      </div>
    </div>
  );
}

// ==============================
// KPI CARD COMPONENT
// ==============================
type KpiProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
};

function KpiCard({ icon: Icon, label, value, sub }: KpiProps) {
  return (
    <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-indigo-600" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
        {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}
