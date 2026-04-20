// =======================
// EMPLOYEE HOME PAGE FULL
// =======================

import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle,
  Clock,
  LogIn,
  LogOut,
  Gift,
  IdCard,
  Calendar,
  ListTodo,
  TrendingUp,
  User,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API = "http://127.0.0.1:8000";

export default function EmployeeHome() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const employeeId = user?.employee_id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [kpiChart, setKpiChart] = useState<any[]>([]);

  // 📅 Ngày hiện tại
  const today = new Date();
  const todayStr =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

  // ======================================================
  // 📌 LOAD DATA
  // ======================================================
  const loadData = async () => {
    const res = await fetch(`${API}/employee-home/${employeeId}`);
    const json = await res.json();

    // Tạo điểm KPI biểu đồ
    const chartData = (json.attendance_history || []).map((day: any) => ({
      date: day.date.slice(5),
      score:
        day.status === "On time"
          ? 3
          : day.status === "Early"
          ? 2
          : day.status === "Late"
          ? 1
          : 0,
    }));

    setKpiChart(chartData);
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ======================================================
  // 📌 CHECK-IN / OUT
  // ======================================================
  const handleCheck = async (type: "in" | "out") => {
    if (!employeeId) return;

    setChecking(true);
    try {
      const url =
        type === "in"
          ? `${API}/attendance/${employeeId}/check-in?date=${todayStr}`
          : `${API}/attendance/${employeeId}/check-out?date=${todayStr}`;

      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Lỗi check in/out");
        return;
      }

      await loadData();
    } finally {
      setChecking(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-10 text-center text-slate-500 animate-pulse">
        Đang tải dữ liệu...
      </div>
    );
  }

  const emp = data.employee;
  const att = data.attendance_today;

  // ======================= TASK SUMMARY =======================
  const tasks = data.tasks || [];
  let tasksSummary = data.tasks_summary;

  if (!tasksSummary) {
    let todo = 0,
      in_progress = 0,
      done = 0;

    tasks.forEach((t: any) => {
      if (t.status === "todo") todo++;
      if (t.status === "in_progress") in_progress++;
      if (t.status === "done") done++;
    });

    tasksSummary = {
      total: tasks.length,
      todo,
      in_progress,
      done,
    };
  }

  // lấy 4 task gần nhất
  const topTasks = tasks.slice(0, 4);
  // ======================================================
  // UI BẮT ĐẦU
  // ======================================================
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">

      {/* ========================================================= */}
      {/* 1) HEADER */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="text-blue-600" size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              👋 Xin chào,{" "}
              <span className="text-blue-600">{emp.name}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Chúc bạn một ngày làm việc hiệu quả!
            </p>
          </div>
        </div>

        <div className="text-right text-xs md:text-sm text-slate-500">
          <p>
            Hôm nay:{" "}
            <span className="font-medium">
              {today.toLocaleDateString("vi-VN")}
            </span>
          </p>
          <p>Mã nhân viên: {emp.id}</p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2) TOP SUMMARY CARDS */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* CARD: CHẤM CÔNG HÔM NAY */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <Clock className="text-emerald-600" size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Chấm công hôm nay
              </p>
              <p className="font-semibold text-lg text-slate-900">
                {att ? att.status : "Chưa chấm công"}
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-600 mb-3 space-y-1">
            <p>
              Vào:{" "}
              <span className="font-medium text-slate-800">
                {att?.check_in || "--:--"}
              </span>
            </p>
            <p>
              Ra:{" "}
              <span className="font-medium text-slate-800">
                {att?.check_out || "--:--"}
              </span>
            </p>
          </div>

          <div className="flex gap-3 mt-1">
            <button
              onClick={() => handleCheck("in")}
              disabled={checking}
              className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-xl py-2 transition"
            >
              <LogIn size={14} /> Check-in
            </button>

            <button
              onClick={() => handleCheck("out")}
              disabled={checking}
              className="flex-1 inline-flex items-center justify-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-xl py-2 transition"
            >
              <LogOut size={14} /> Check-out
            </button>
          </div>
        </div>

        {/* CARD: KPI */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
              <CheckCircle className="text-purple-600" size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Hiệu suất tháng này
              </p>
              <p className="font-semibold text-lg text-slate-900">
                {data.kpi.total_days} ngày làm
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs mt-2">
            <div className="bg-slate-50 rounded-xl px-2 py-2 text-center">
              <p className="text-slate-500">Đúng giờ</p>
              <p className="font-semibold text-emerald-600">
                {data.kpi.ontime_days}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl px-2 py-2 text-center">
              <p className="text-slate-500">Đi trễ</p>
              <p className="font-semibold text-red-500">
                {data.kpi.late_days}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl px-2 py-2 text-center">
              <p className="text-slate-500">Về sớm</p>
              <p className="font-semibold text-orange-500">
                {data.kpi.early_days}
              </p>
            </div>
          </div>
        </div>

        {/* CARD: CÔNG VIỆC */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <ListTodo className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Công việc của bạn
              </p>
              <p className="font-semibold text-lg text-slate-900">
                {tasksSummary.total} nhiệm vụ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs mt-2">
            <div className="bg-slate-50 rounded-xl px-2 py-2 text-center">
              <p className="text-slate-500">Chưa làm</p>
              <p className="font-semibold text-slate-800">{tasksSummary.todo}</p>
            </div>
            <div className="bg-slate-50 rounded-xl px-2 py-2 text-center">
              <p className="text-slate-500">Đang làm</p>
              <p className="font-semibold text-amber-500">
                {tasksSummary.in_progress}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl px-2 py-2 text-center">
              <p className="text-slate-500">Xong</p>
              <p className="font-semibold text-emerald-600">
                {tasksSummary.done}
              </p>
            </div>
          </div>
        </div>

        {/* CARD: THÔNG BÁO + PHÚC LỢI */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
              <Bell className="text-rose-500" size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Thông báo mới
              </p>
              <p className="font-semibold text-lg text-slate-900">
                {data.notifications.length}
              </p>
            </div>
          </div>

          <div className="flex justify-between text-xs mt-1">
            <div>
              <p className="text-slate-500">Phúc lợi tham gia</p>
              <p className="font-semibold text-indigo-600">
                {data.benefits.length} chương trình
              </p>
            </div>
            <Gift className="text-indigo-500" size={18} />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3) KPI CHART */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={20} />
              <h2 className="text-sm font-semibold text-slate-800">
                Biểu đồ KPI chấm công tháng này
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Đúng giờ = 3 • Về sớm = 2 • Đi trễ = 1
            </span>
          </div>

          {kpiChart.length === 0 ? (
            <p className="text-xs text-slate-400">Chưa có dữ liệu KPI.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiChart}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                    }}
                    formatter={(value: any) => [`Điểm: ${value}`, "KPI"]}
                    labelFormatter={(label: any) => `Ngày: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        {/* ========================================================= */}
        {/* LỊCH SỬ CHẤM CÔNG GẦN ĐÂY */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-blue-500" size={18} />
            <h2 className="text-sm font-semibold text-slate-800">
              Lịch sử chấm công gần đây
            </h2>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {data.attendance_history.map((h: any, i: number) => (
              <div
                key={i}
                className="flex justify-between px-3 py-2 rounded-xl border border-slate-100 bg-slate-50"
              >
                <span className="text-xs text-slate-700">{h.date}</span>
                <span
                  className={`text-xs font-medium ${
                    h.status === "Late"
                      ? "text-red-500"
                      : h.status === "Early"
                      ? "text-amber-500"
                      : "text-emerald-600"
                  }`}
                >
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CÔNG VIỆC + THÔNG BÁO + PHÚC LỢI + HỢP ĐỒNG */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-4">
        
        {/* =================== CÔNG VIỆC =================== */}
        <div className="xl:col-span-2 space-y-6">

          {/* DANH SÁCH CÔNG VIỆC */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ListTodo className="text-blue-600" size={18} />
                <h2 className="text-sm font-semibold text-slate-800">
                  Công việc gần đây của bạn
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                Hiển thị tối đa 4 công việc
              </span>
            </div>

            {topTasks.length === 0 ? (
              <p className="text-xs text-slate-400">
                Hiện tại bạn chưa có công việc nào được giao.
              </p>
            ) : (
              <div className="space-y-3">
                {topTasks.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition cursor-default"
                  >
                    <div className="flex items-start justify-between gap-3">
                      
                      {/* LEFT SIDE */}
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {t.title}
                        </p>
                        {t.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {t.description}
                          </p>
                        )}
                        <p className="mt-1 text-[11px] text-slate-500">
                          Deadline:{" "}
                          <span className="font-medium">
                            {t.deadline ? t.deadline.slice(0, 10) : "Chưa đặt"}
                          </span>
                        </p>
                      </div>

                      {/* RIGHT SIDE */}
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${
                            t.status === "done"
                              ? "bg-emerald-100 text-emerald-700"
                              : t.status === "in_progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {t.status === "done"
                            ? "Hoàn thành"
                            : t.status === "in_progress"
                            ? "Đang làm"
                            : "Chưa làm"}
                        </span>

                        {/* PROGRESS BAR */}
                        <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              t.progress >= 100
                                ? "bg-emerald-500"
                                : t.progress >= 70
                                ? "bg-blue-500"
                                : "bg-amber-400"
                            }`}
                            style={{ width: `${Math.min(t.progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {t.progress}%
                        </span>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

       
        </div>

        {/* =================== PHÚC LỢI + HỢP ĐỒNG =================== */}
        <div className="space-y-6">

          {/* PHÚC LỢI */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="text-green-600" size={18} />
              <h2 className="text-sm font-semibold text-slate-800">
                Phúc lợi bạn đã đăng ký
              </h2>
            </div>

            {data.benefits.length === 0 ? (
              <p className="text-xs text-slate-400">Bạn chưa tham gia chương trình phúc lợi nào.</p>
            ) : (
              <div className="space-y-2">
                {data.benefits.map((b: any) => (
                  <div key={b.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-medium text-sm">{b.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Hạn đăng ký: <span className="font-medium">{b.registration_end}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HỢP ĐỒNG */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <IdCard className="text-purple-600" size={18} />
              <h2 className="text-sm font-semibold text-slate-800">
                Hợp đồng lao động
              </h2>
            </div>

            {data.contracts.length === 0 ? (
              <p className="text-xs text-slate-400">Chưa có thông tin hợp đồng.</p>
            ) : (
              <div className="space-y-2">
                {data.contracts.map((c: any) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-medium text-sm">Loại hợp đồng: {c.type}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {c.start} → {c.end || "Không thời hạn"}
                    </p>
                    <p
                      className={`text-xs font-medium mt-1 ${
                        c.status === "active"
                          ? "text-emerald-600"
                          : "text-slate-500"
                      }`}
                    >
                      {c.status === "active" ? "Đang hiệu lực" : c.status}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
