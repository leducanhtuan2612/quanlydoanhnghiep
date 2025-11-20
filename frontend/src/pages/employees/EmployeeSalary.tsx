import { useEffect, useState } from "react";
import { ArrowLeft, FileDown } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const API_SALARY = "http://127.0.0.1:8000/salary";
const API_EMP = "http://127.0.0.1:8000/employees";

export default function EmployeeSalary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const employeeId = Number(id);

  const now = new Date();
  const defaultMonth = now.toISOString().slice(0, 7);

  const [month, setMonth] = useState(defaultMonth);
  const [salary, setSalary] = useState<any>(null);
  const [emp, setEmp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch nhân viên
  const fetchEmployee = async () => {
    const res = await fetch(`${API_EMP}/${employeeId}`);
    const data = await res.json();
    setEmp(data);
  };

  // Fetch lương
  const fetchSalary = async () => {
    setLoading(true);
    try {
      const [y, m] = month.split("-");
      const res = await fetch(`${API_SALARY}/${employeeId}?year=${y}&month=${m}`);
      const json = await res.json();
      setSalary(json);
    } catch {
      setSalary(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployee();
    fetchSalary();
  }, [month]);

  const exportExcel = () => {
    const [y, m] = month.split("-");
    window.open(`${API_SALARY}/export/${employeeId}?year=${y}&month=${m}`);
  };

  const formatMoney = (v: number) =>
    Number(v || 0).toLocaleString("vi-VN");

  return (
    <div className="space-y-8 p-6 bg-slate-50 min-h-screen">

      <button
        onClick={() => navigate(`/employees/profile/${employeeId}`)}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-black"
      >
        <ArrowLeft size={18} /> Quay lại hồ sơ
      </button>

      {/* HEADER NHÂN VIÊN */}
      <div className="bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4">
        
        <div className="w-16 h-16 rounded-full overflow-hidden border shadow">
          <img
            src={
              emp?.avatar
                ? `http://127.0.0.1:8000${emp.avatar}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    emp?.name || "NV"
                  )}&size=200`
            }
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm text-slate-500">Nhân viên</p>
          <p className="text-lg font-semibold text-slate-900">
            {emp?.name || "—"}
          </p>

          <div className="flex gap-5 text-sm text-slate-600">
            <span><strong>Phòng ban:</strong> {emp?.department || "—"}</span>
            <span><strong>Chức vụ:</strong> {emp?.position || "—"}</span>
          </div>
        </div>
      </div>

      <h1 className="text-xl font-semibold">Chi tiết tính lương</h1>

      <div className="bg-white p-4 rounded-xl border flex items-center gap-3 shadow-sm">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        />

        <button
          onClick={exportExcel}
          className="ml-auto flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-black"
        >
          <FileDown size={16} /> Xuất Excel
        </button>
      </div>

      {/* CARD LƯƠNG */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        {loading && <p className="text-center text-slate-500 py-8">Đang tải dữ liệu...</p>}

        {!loading && !salary && (
          <p className="text-center text-slate-500 py-8">Không có dữ liệu lương</p>
        )}

        {!loading && salary && (
          <div className="grid gap-3 text-[15px]">
            <Row label="💵 Lương cơ bản" value={`${formatMoney(salary.base_salary)} VNĐ`} />
            <Row label="📅 Lương mỗi ngày" value={`${formatMoney(salary.daily_salary)} VNĐ`} />

            <Row label="🟢 Ngày làm đủ" value={salary.total_days} />
            <Row label="🔴 Đi muộn" value={salary.late} />
            <Row label="🟡 Về sớm" value={salary.early} />

            <Row label="💸 Tiền phạt" value={`${formatMoney(salary.penalty)} VNĐ`} />

            <div className="flex justify-between font-bold text-lg border-t pt-4">
              <span>Lương thực lãnh:</span>
              <span className="text-green-600">
                {formatMoney(salary.final_salary)} VNĐ
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
