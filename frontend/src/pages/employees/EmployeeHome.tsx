import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle,
  Clock,
  DoorOpen,
  FileText,
  Gift,
  IdCard,
  LogIn,
  LogOut,
  User,
  Calendar,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

export default function EmployeeHome() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const employeeId = user?.employee_id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  // 🕒 chuẩn ngày local VN
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
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ======================================================
  // 📌 CHECK-IN / CHECK-OUT
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

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">Đang tải...</div>
    );
  }

  const emp = data.employee;
  const att = data.attendance_today;

  return (
    <div className="p-6 space-y-6">

      {/* ========================================================= */}
      {/* HEADER */}
      {/* ========================================================= */}
      <div>
        <h1 className="text-3xl font-bold">
          👋 Xin chào,{" "}
          <span className="text-blue-600">{emp.name}</span>
        </h1>
        <p className="text-gray-500 mt-1">
          Chào mừng bạn đến với hệ thống quản lý doanh nghiệp.
        </p>
      </div>

      {/* ========================================================= */}
      {/* TOP CARDS */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* CHẤM CÔNG */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Chấm công hôm nay</p>
              <p className="font-bold text-lg">
                {att ? att.status : "Chưa chấm công"}
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-3">
            Vào: {att?.check_in || "--:--"}
            <br />
            Ra: {att?.check_out || "--:--"}
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={() => handleCheck("in")}
              disabled={checking}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
            >
              <LogIn className="inline-block w-4 h-4 mr-1" />
              Check-in
            </button>

            <button
              onClick={() => handleCheck("out")}
              disabled={checking}
              className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600"
            >
              <LogOut className="inline-block w-4 h-4 mr-1" />
              Check-out
            </button>
          </div>
        </div>

        {/* THÔNG BÁO */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Thông báo mới</p>
              <p className="font-bold text-lg">
                {data.notifications.length}
              </p>
            </div>
          </div>
          <p className="text-sm text-blue-600 underline cursor-pointer">
            Xem chi tiết bên dưới
          </p>
        </div>

        {/* PHÚC LỢI */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Phúc lợi đang tham gia</p>
              <p className="font-bold text-lg">{data.benefits.length}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Xem trong mục Phúc Lợi</p>
        </div>

        {/* KPI */}
        <div className="bg-white p-5 rounded-xl shadow border">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="text-purple-600" />
            <div>
              <p className="text-sm text-gray-500">Hiệu suất tháng này</p>
              <p className="font-bold text-lg">
                {data.kpi.total_days} ngày làm
              </p>
            </div>
          </div>
          <div className="text-xs space-y-1">
            <p>Đúng giờ: {data.kpi.ontime_days}</p>
            <p className="text-red-600">Đi trễ: {data.kpi.late_days}</p>
            <p className="text-orange-600">Về sớm: {data.kpi.early_days}</p>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* LỊCH SỬ CHẤM CÔNG */}
      {/* ========================================================= */}
      <div className="bg-white p-5 rounded-xl shadow border">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-blue-500" />
          <h2 className="text-xl font-semibold">
            Lịch sử chấm công gần đây
          </h2>
        </div>

        <div className="space-y-2">
          {data.attendance_history.map((h: any, i: number) => (
            <div
              key={i}
              className="flex justify-between px-4 py-2 rounded-lg border bg-gray-50"
            >
              <span>{h.date}</span>
              <span
                className={
                  h.status === "Late"
                    ? "text-red-500"
                    : h.status === "Early"
                    ? "text-orange-500"
                    : "text-green-600"
                }
              >
                {h.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* THÔNG BÁO */}
      {/* ========================================================= */}
      <div className="bg-white p-5 rounded-xl shadow border">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="text-red-500" />
          <h2 className="text-xl font-semibold">Thông báo mới</h2>
        </div>

        <div className="space-y-3">
          {data.notifications.map((n: any) => (
            <div
              key={n.id}
              className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer"
            >
              <p className="font-medium">{n.title}</p>
              <p className="text-xs text-gray-500">{n.time}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* PHÚC LỢI */}
      {/* ========================================================= */}
      <div className="bg-white p-5 rounded-xl shadow border">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="text-green-600" />
          <h2 className="text-xl font-semibold">Phúc lợi bạn đã đăng ký</h2>
        </div>

        <div className="space-y-2">
          {data.benefits.map((b: any) => (
            <div key={b.id} className="p-4 bg-gray-50 rounded-lg border">
              <p className="font-medium">{b.title}</p>
              <p className="text-xs text-gray-500">
                Hạn đăng ký: {b.registration_end}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* HỢP ĐỒNG */}
      {/* ========================================================= */}
      <div className="bg-white p-5 rounded-xl shadow border">
        <div className="flex items-center gap-2 mb-4">
          <IdCard className="text-purple-600" />
          <h2 className="text-xl font-semibold">Hợp đồng lao động</h2>
        </div>

        <div className="space-y-2">
          {data.contracts.map((c: any) => (
            <div key={c.id} className="p-4 bg-gray-50 border rounded-lg">
              <p className="font-medium">Loại: {c.type}</p>
              <p className="text-sm">
                {c.start} → {c.end || "Không thời hạn"}
              </p>
              <p
                className={
                  c.status === "active"
                    ? "text-green-600"
                    : "text-gray-500"
                }
              >
                {c.status}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
