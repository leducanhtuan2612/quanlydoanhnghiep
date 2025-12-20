import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import {
  CalendarDays,
  ClipboardList,
  CheckCircle,
  XCircle,
  Hourglass,
  Trash2,
} from "lucide-react";

/* =========================
   TYPES (KHỚP BE)
========================= */
type LeaveStatus =
  | "đang chờ xử lý"
  | "đã duyệt"
  | "bị từ chối"
  | "đã hủy";

type LeaveType = "hàng năm" | "ốm" | "không lương";

type Leave = {
  id: number;
  employee_id: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason?: string | null;
  status: LeaveStatus;
  decision_note?: string | null;
  created_at: string;
};

/* =========================
   UI CONFIG
========================= */
const typeLabel: Record<LeaveType, string> = {
  "hàng năm": "Nghỉ phép năm",
  "ốm": "Nghỉ bệnh",
  "không lương": "Nghỉ không lương",
};

const statusMeta: Record<
  LeaveStatus,
  { label: string; badge: string; border: string; icon: any }
> = {
  "đang chờ xử lý": {
    label: "Chờ duyệt",
    badge: "bg-yellow-100 text-yellow-700",
    border: "border-yellow-400",
    icon: Hourglass,
  },
  "đã duyệt": {
    label: "Đã duyệt",
    badge: "bg-green-100 text-green-700",
    border: "border-green-400",
    icon: CheckCircle,
  },
  "bị từ chối": {
    label: "Bị từ chối",
    badge: "bg-red-100 text-red-700",
    border: "border-red-400",
    icon: XCircle,
  },
  "đã hủy": {
    label: "Đã hủy",
    badge: "bg-gray-100 text-gray-600",
    border: "border-gray-300",
    icon: Trash2,
  },
};

const StatusBadge = ({ status }: { status: LeaveStatus }) => {
  const Icon = statusMeta[status].icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${statusMeta[status].badge}`}
    >
      <Icon size={14} />
      {statusMeta[status].label}
    </span>
  );
};

/* =========================
   COMPONENT
========================= */
export default function EmployeeLeavePage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const employeeId: number = user?.employee_id;

  const [rows, setRows] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);

  // form
  const [leaveType, setLeaveType] = useState<LeaveType>("hàng năm");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [filterStatus, setFilterStatus] =
    useState<LeaveStatus | "all">("all");

  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const canSubmit = useMemo(() => {
    return employeeId && startDate && endDate && endDate >= startDate;
  }, [employeeId, startDate, endDate]);

  /* =========================
     LOAD DATA
  ========================= */
  const load = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const url =
        filterStatus === "all"
          ? `/leave-requests/employee/${employeeId}`
          : `/leave-requests/employee/${employeeId}?status=${filterStatus}`;
      const res = await api.get(url);
      setRows(res.data);
    } catch {
      setMsg({ type: "err", text: "Không tải được đơn nghỉ phép" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [employeeId, filterStatus]);

  /* =========================
     SUBMIT
  ========================= */
  const submit = async () => {
    setMsg(null);
    if (!canSubmit) {
      setMsg({ type: "err", text: "Ngày không hợp lệ" });
      return;
    }
    try {
      await api.post("/leave-requests/", {
        employee_id: employeeId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason || null,
      });
      setMsg({ type: "ok", text: "✅ Gửi đơn nghỉ thành công" });
      setReason("");
      load();
    } catch (e: any) {
      setMsg({
        type: "err",
        text: e?.response?.data?.detail || "Gửi đơn thất bại",
      });
    }
  };

  /* =========================
     CANCEL
  ========================= */
  const cancel = async (id: number) => {
    await api.put(`/leave-requests/${id}/cancel?employee_id=${employeeId}`);
    load();
  };

  /* =========================
     KPI
  ========================= */
  const stats = {
    total: rows.length,
    pending: rows.filter((r) => r.status === "đang chờ xử lý").length,
    approved: rows.filter((r) => r.status === "đã duyệt").length,
    rejected: rows.filter((r) => r.status === "bị từ chối").length,
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="p-6 space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
          <CalendarDays size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Xin nghỉ phép</h1>
          <p className="text-sm text-gray-500">
            Quản lý và theo dõi trạng thái đơn nghỉ của bạn
          </p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng đơn", value: stats.total, color: "text-blue-700 bg-blue-50" },
          { label: "Chờ duyệt", value: stats.pending, color: "text-yellow-700 bg-yellow-50" },
          { label: "Đã duyệt", value: stats.approved, color: "text-green-700 bg-green-50" },
          { label: "Từ chối", value: stats.rejected, color: "text-red-700 bg-red-50" },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-2xl shadow-sm border p-4 ${k.color}`}
          >
            <p className="text-sm">{k.label}</p>
            <p className="text-3xl font-bold">{k.value}</p>
          </div>
        ))}
      </div>

      {/* MAIN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow border border-blue-100 p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <ClipboardList size={18} /> Gửi đơn xin nghỉ
          </h2>

          <select
            className="w-full border rounded-xl p-2"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
          >
            <option value="hàng năm">Nghỉ phép năm</option>
            <option value="ốm">Nghỉ bệnh</option>
            <option value="không lương">Nghỉ không lương</option>
          </select>

          <input
            type="date"
            className="w-full border rounded-xl p-2"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="w-full border rounded-xl p-2"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <textarea
            rows={4}
            className="w-full border rounded-xl p-2"
            placeholder="Lý do xin nghỉ"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <button
            disabled={!canSubmit}
            onClick={submit}
            className={`w-full rounded-xl py-2 font-semibold text-white transition ${
              canSubmit
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Gửi đơn
          </button>
        </div>

        {/* LIST */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Đơn nghỉ của tôi</h2>
            <select
              className="border rounded-xl px-3 py-2 text-sm bg-white shadow-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">Tất cả</option>
              <option value="đang chờ xử lý">Chờ duyệt</option>
              <option value="đã duyệt">Đã duyệt</option>
              <option value="bị từ chối">Bị từ chối</option>
              <option value="đã hủy">Đã hủy</option>
            </select>
          </div>

          {rows.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-2xl shadow p-5 space-y-2 border-l-4 ${statusMeta[r.status].border}`}
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{typeLabel[r.leave_type]}</p>
                  <p className="text-sm text-gray-500">
                    {r.start_date} → {r.end_date}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>

              {r.status === "bị từ chối" && r.decision_note && (
                <p className="text-sm text-gray-500">
                  Lý do: {r.decision_note}
                </p>
              )}

              {r.status === "đang chờ xử lý" && (
                <button
                  onClick={() => cancel(r.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Hủy đơn
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
