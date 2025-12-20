import { useEffect, useState } from "react";
import api from "../../api";
import {
  CheckCircle,
  XCircle,
  RefreshCcw,
  ClipboardCheck,
  User,
} from "lucide-react";

type Leave = {
  id: number;
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string | null;
  status: string;
  created_at: string;
};

const StatusBadge = ({ status }: { status: string }) => {
  const style: Record<string, string> = {
    "đang chờ xử lý": "bg-yellow-100 text-yellow-700",
    "đã duyệt": "bg-green-100 text-green-700",
    "bị từ chối": "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 text-xs rounded-full font-medium ${
        style[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
};

export default function LeaveApprovalPage() {
  const role = localStorage.getItem("role");
  if (role !== "admin" && role !== "manager") {
    return (
      <div className="p-6 text-red-600 font-medium">
        ❌ Bạn không có quyền truy cập chức năng duyệt nghỉ phép
      </div>
    );
  }

  const admin =
    JSON.parse(localStorage.getItem("admin") || "null") ||
    JSON.parse(localStorage.getItem("user") || "null");

  const approvedById = admin?.id || null;

  const [rows, setRows] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/leave-requests?status=đang chờ xử lý");
      setRows(res.data);
    } catch (e: any) {
      setError("Không tải được danh sách đơn nghỉ phép");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (id: number, status: "đã duyệt" | "bị từ chối") => {
    await api.put(`/leave-requests/${id}/decision`, {
      status,
      decision_note:
        status === "bị từ chối" ? note[id] || "Không đủ điều kiện" : null,
      approved_by_id: approvedById,
    });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-semibold">
              Duyệt đơn nghỉ phép
            </h1>
            <p className="text-sm text-gray-500">
              Quản lý và xét duyệt đơn nghỉ của nhân viên
            </p>
          </div>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white hover:bg-gray-50"
        >
          <RefreshCcw size={16} />
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* LIST CARD */}
      <div className="grid grid-cols-1 gap-4">
        {!loading && rows.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-500">
            Không có đơn nghỉ phép đang chờ xử lý
          </div>
        )}

        {rows.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4"
          >
            {/* TOP */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                {/* AVATAR */}
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                  <User size={20} />
                </div>

                <div>
                  <p className="font-semibold text-gray-800">
                    Nhân viên #{r.employee_id}
                  </p>
                  <p className="text-sm text-gray-500">
                    {r.leave_type} • {r.start_date} → {r.end_date}
                  </p>
                </div>
              </div>

              <StatusBadge status={r.status} />
            </div>

            {/* REASON */}
            <div className="text-sm text-gray-700">
              <b>Lý do:</b> {r.reason || "Không có"}
            </div>

            {/* ACTION */}
            <div className="flex flex-col md:flex-row gap-3">
              <input
                className="flex-1 border rounded-xl p-3 text-sm"
                placeholder="Ghi chú khi từ chối (nếu có)"
                value={note[r.id] || ""}
                onChange={(e) =>
                  setNote((p) => ({ ...p, [r.id]: e.target.value }))
                }
              />

              <div className="flex gap-2">
                <button
                  onClick={() => decide(r.id, "đã duyệt")}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
                >
                  <CheckCircle size={16} />
                  Duyệt
                </button>

                <button
                  onClick={() => decide(r.id, "bị từ chối")}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  <XCircle size={16} />
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        * Mọi thao tác duyệt/từ chối đều được ghi nhận để phục vụ báo cáo và kiểm soát nhân sự.
      </p>
    </div>
  );
}
