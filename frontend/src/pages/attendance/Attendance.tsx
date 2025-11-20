import { useEffect, useState } from "react";
import { Calendar, FileDown, Pencil, Trash, ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000/attendance";

type Attendance = {
  id: number;
  employee_name: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
};

export default function AttendancePage() {
  const { id } = useParams();
  const employeeId = Number(id);
  const navigate = useNavigate();

  const role = localStorage.getItem("role");

  // Fix timezone
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const defaultDate = now.toISOString().split("T")[0];
  const defaultMonth = defaultDate.slice(0, 7);

  const [data, setData] = useState<Attendance[]>([]);
  const [date, setDate] = useState(defaultDate);
  const [loading, setLoading] = useState(true);

  const [month, setMonth] = useState(defaultMonth);
  const [monthlyData, setMonthlyData] = useState<Attendance[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  // Modal edit
  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Attendance | null>(null);
  const [editIn, setEditIn] = useState("");
  const [editOut, setEditOut] = useState("");

  // ============================
  // FETCH — Lấy dữ liệu theo ngày
  // ============================
  const fetchAttendance = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}?employee_id=${employeeId}&date=${date}`
      );
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch {
      setData([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  // ============================
  // FETCH — Theo tháng
  // ============================
  const fetchMonthlyAttendance = async () => {
    setLoadingMonthly(true);
    const [y, m] = month.split("-");

    try {
      const res = await fetch(
        `${API_URL}/monthly/${employeeId}?year=${y}&month=${m}`
      );
      const json = await res.json();
      setMonthlyData(Array.isArray(json) ? json : []);
    } catch {
      setMonthlyData([]);
    }

    setLoadingMonthly(false);
  };

  useEffect(() => {
    fetchMonthlyAttendance();
  }, [month]);

  // ============================
  // CHECK IN / OUT — gửi kèm date
  // ============================
  const handleCheckIn = async () => {
    await fetch(`${API_URL}/${employeeId}/check-in?date=${date}`, {
      method: "POST",
    });

    fetchAttendance();
    fetchMonthlyAttendance();
  };

  const handleCheckOut = async () => {
    await fetch(`${API_URL}/${employeeId}/check-out?date=${date}`, {
      method: "POST",
    });

    fetchAttendance();
    fetchMonthlyAttendance();
  };

  // ============================
  // EXPORT EXCEL
  // ============================
  const handleExportExcel = () => {
    const [y, m] = month.split("-");
    window.open(`${API_URL}/export/${employeeId}?year=${y}&month=${m}`);
  };

  // ============================
  // EDIT
  // ============================
  const openEdit = (item: Attendance) => {
    setEditRecord(item);
    setEditIn(item.check_in ? item.check_in.slice(0, 5) : "");
    setEditOut(item.check_out ? item.check_out.slice(0, 5) : "");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editRecord) return;

    await fetch(`${API_URL}/update/${editRecord.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        check_in: editIn || null,
        check_out: editOut || null,
      }),
    });

    setEditOpen(false);
    fetchAttendance();
    fetchMonthlyAttendance();
  };

  // ============================
  // DELETE
  // ============================
  const deleteRecord = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa bản ghi này?")) return;

    await fetch(`${API_URL}/delete/${id}`, { method: "DELETE" });

    fetchAttendance();
    fetchMonthlyAttendance();
  };

  return (
    <div className="space-y-8 p-6">

      {/* NÚT QUAY LẠI HỒ SƠ */}
    <div>
  <button
    onClick={() => navigate(`/employees/profile/${employeeId}`)}
    className="inline-flex items-center gap-2 text-slate-600 hover:text-black"
  >
    <ArrowLeft size={18} />
    Quay lại hồ sơ
  </button>
</div>

      <h1 className="text-xl font-semibold">Chấm công</h1>

      {/* ----------- NGÀY ----------- */}
      <section className="space-y-4">
        <div className="bg-white p-4 rounded-xl border flex items-center gap-3">
          <Calendar />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />

          <button
            onClick={handleCheckIn}
            className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Chấm công vào
          </button>

          <button
            onClick={handleCheckOut}
            className="bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Chấm công ra
          </button>
        </div>

        {/* Table ngày */}
        <div className="bg-white border rounded-xl overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-slate-500">Đang tải…</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="px-4 py-2 text-left">Nhân viên</th>
                  <th className="px-4 py-2">Giờ vào</th>
                  <th className="px-4 py-2">Giờ ra</th>
                  <th className="px-4 py-2">Trạng thái</th>
                  {role === "admin" && (
                    <th className="px-4 py-2">Hành động</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {data.length > 0 ? (
                  data.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3">{item.employee_name}</td>
                      <td className="px-4 py-3">{item.check_in || "—"}</td>
                      <td className="px-4 py-3">{item.check_out || "—"}</td>
                      <td className="px-4 py-3">{item.status}</td>

                      {role === "admin" && (
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="px-2 py-1 bg-yellow-500 text-white rounded flex items-center gap-1"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            onClick={() => deleteRecord(item.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded flex items-center gap-1"
                          >
                            <Trash size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ----------- THÁNG ----------- */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Lịch sử chấm công theo tháng</h2>

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />

          <button
            onClick={handleExportExcel}
            className="ml-auto flex items-center gap-2 bg-slate-800 text-white px-3 py-2 rounded-lg"
          >
            <FileDown size={16} /> Xuất Excel
          </button>
        </div>

        <div className="bg-white border rounded-xl overflow-x-auto">
          {loadingMonthly ? (
            <div className="p-6 text-center text-slate-500">Đang tải…</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="px-4 py-2">Ngày</th>
                  <th className="px-4 py-2">Giờ vào</th>
                  <th className="px-4 py-2">Giờ ra</th>
                  <th className="px-4 py-2">Trạng thái</th>
                  {role === "admin" && (
                    <th className="px-4 py-2">Hành động</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {monthlyData.length > 0 ? (
                  monthlyData.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3">{item.date}</td>
                      <td className="px-4 py-3">{item.check_in || "—"}</td>
                      <td className="px-4 py-3">{item.check_out || "—"}</td>
                      <td className="px-4 py-3">{item.status}</td>

                      {role === "admin" && (
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="px-2 py-1 bg-yellow-500 text-white rounded flex items-center gap-1"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            onClick={() => deleteRecord(item.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded flex items-center gap-1"
                          >
                            <Trash size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-500">
                      Không có dữ liệu tháng này
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* MODAL EDIT */}
      {editOpen && editRecord && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[380px] space-y-4">
            <h3 className="text-lg font-semibold">Chỉnh sửa chấm công</h3>

            <div>
              <label>Giờ vào:</label>
              <input
                type="time"
                value={editIn}
                onChange={(e) => setEditIn(e.target.value)}
                className="border w-full px-3 py-2 rounded-lg"
              />
            </div>

            <div>
              <label>Giờ ra:</label>
              <input
                type="time"
                value={editOut}
                onChange={(e) => setEditOut(e.target.value)}
                className="border w-full px-3 py-2 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditOpen(false)}
                className="px-3 py-2 bg-slate-300 rounded"
              >
                Hủy
              </button>

              <button
                onClick={saveEdit}
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
