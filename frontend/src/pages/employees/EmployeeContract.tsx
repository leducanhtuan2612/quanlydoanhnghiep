import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, XCircle } from "lucide-react";

const EMP_API = "http://127.0.0.1:8000/employees";
const CONTRACT_API = "http://127.0.0.1:8000/contracts";

export default function EmployeeContract() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // form tạo hợp đồng
  const [contractType, setContractType] = useState("Chính thức");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin" || localStorage.getItem("role") === "admin";

  useEffect(() => {
    fetchEmployee();
    fetchContracts();
  }, []);

  const fetchEmployee = async () => {
    const res = await fetch(`${EMP_API}/${id}`);
    const data = await res.json();
    setEmployee(data);
  };

  const fetchContracts = async () => {
    const res = await fetch(`${CONTRACT_API}?employee_id=${id}`);
    const data = await res.json();
    setContracts(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const createContract = async () => {
    if (!startDate || !endDate) return;

    await fetch(CONTRACT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id: Number(id),
        contract_type: contractType,
        start_date: startDate,
        end_date: endDate,
        note,
      }),
    });

    setShowForm(false);
    setStartDate("");
    setEndDate("");
    setNote("");
    fetchContracts();
  };

  const endContract = async (contractId: number) => {
    await fetch(`${CONTRACT_API}/${contractId}/end`, {
      method: "PUT",
    });
    fetchContracts();
  };

  if (!employee) return <div className="p-6">Đang tải...</div>;

  const avatarUrl = employee.avatar
    ? `http://127.0.0.1:8000${employee.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        employee.name
      )}&size=220&background=f3f4f6&color=0f172a`;

  const formatMoney = (v: number | null | undefined) => {
    if (!v && v !== 0) return "—";
    return v.toLocaleString("vi-VN") + " đ";
  };

  const statusBadge = (status: string) => {
    if (status === "active") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
          <Check size={14} /> Đang hiệu lực
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
        <XCircle size={14} /> Đã chấm dứt
      </span>
    );
  };

  return (
    <div className="flex w-full">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r h-screen p-4 space-y-4 sticky top-0">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Nhân viên</h2>

        <div className="space-y-2 text-slate-700 text-sm font-medium">
          <MenuItem label="Hồ sơ" onClick={() => navigate(`/employees/profile/${id}`)} />
          <MenuItem label="Chấm công" onClick={() => navigate(`/attendance/${id}`)} />
          <MenuItem label="Tiền lương" onClick={() => navigate(`/employees/salary/${id}`)} />
          <MenuItem label="Phúc lợi" onClick={() => navigate(`/employees/${id}/benefits`)} />
          <MenuItem label="Hợp đồng" active />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 bg-slate-50 min-h-screen overflow-auto">
        {/* Back button */}
        <div className="p-4">
          <button
            onClick={() => navigate("/employees")}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-black"
          >
            <ArrowLeft size={18} />
            Quay lại danh sách
          </button>
        </div>

        {/* Banner + Avatar */}
        <div className="relative w-full mx-6">
          <div className="w-full h-52 rounded-xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 -bottom-20 z-[200]">
            <img
              src={avatarUrl}
              className="w-40 h-40 rounded-full border-[6px] border-white shadow-xl object-cover"
            />
          </div>
        </div>

        {/* Name */}
    <div className="mt-24 text-center space-y-1 translate-x-6">
  <h1 className="text-2xl font-bold text-slate-800">{employee.name}</h1>
  <p className="text-slate-500">Hợp đồng lao động</p>
</div>

        {/* Create contract button (admin) */}
        <div className="mt-6 px-6 flex justify-end">
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              {showForm ? "Đóng form" : "+ Tạo hợp đồng mới"}
            </button>
          )}
        </div>

        {/* FORM TẠO HỢP ĐỒNG */}
        {isAdmin && showForm && (
          <div className="px-6 mt-4">
            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-lg mb-2">Tạo hợp đồng lao động</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Loại hợp đồng
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option>Chính thức</option>
                    <option>Thử việc</option>
                    <option>Cộng tác viên</option>
                    <option>Thời vụ</option>
                  </select>
                </div>

                {/* LƯƠNG CƠ BẢN CỐ ĐỊNH 7TR */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Lương cơ bản
                  </label>
                  <div className="w-full border rounded-lg px-3 py-2 bg-slate-100 text-slate-700">
                    7.000.000 đ (cố định)
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Ghi chú</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Điều khoản bổ sung, ghi chú khác..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700"
                >
                  Huỷ
                </button>
                <button
                  onClick={createContract}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Lưu hợp đồng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DANH SÁCH HỢP ĐỒNG */}
        <div className="px-6 py-10 ml-6">
  <div className="bg-white border rounded-xl p-8 shadow-sm">

            <h3 className="font-semibold text-lg mb-6">Danh sách hợp đồng</h3>

            {loading ? (
              <div className="text-center py-6 text-slate-500">Đang tải...</div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                Chưa có hợp đồng nào
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.map((c) => (
                  <div
                    key={c.id}
                    className="border rounded-lg p-4 bg-slate-50 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-slate-800 text-lg">
                            {c.code || `HĐLĐ #${c.id}`}
                          </h4>
                          {statusBadge(c.status)}
                        </div>
                        <p className="text-sm text-slate-500">
                          Loại hợp đồng:{" "}
                          <span className="font-medium text-slate-700">
                            {c.contract_type || "—"}
                          </span>
                        </p>
                      </div>

                      {isAdmin && c.status === "active" && (
                        <button
                          onClick={() => endContract(c.id)}
                          className="px-3 py-2 text-sm rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1"
                        >
                          <XCircle size={16} />
                          Chấm dứt
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm text-slate-700">
                      <div>
                        <span className="font-medium">Ngày bắt đầu:</span>{" "}
                        {c.start_date
                          ? new Date(c.start_date).toLocaleDateString("vi-VN")
                          : "—"}
                      </div>
                      <div>
                        <span className="font-medium">Ngày kết thúc:</span>{" "}
                        {c.end_date
                          ? new Date(c.end_date).toLocaleDateString("vi-VN")
                          : "—"}
                      </div>
                      <div>
                        <span className="font-medium">Lương cơ bản:</span>{" "}
                        {formatMoney(c.basic_salary ?? 7000000)}
                      </div>
                    </div>

                    {c.note && (
                      <p className="mt-3 text-sm text-slate-600">
                        <span className="font-medium">Ghi chú:</span> {c.note}
                      </p>
                    )}
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

function MenuItem({ label, active, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`px-3 py-2 rounded-lg cursor-pointer transition ${
        active ? "bg-blue-600 text-white shadow" : "hover:bg-slate-100 text-slate-700"
      }`}
    >
      {label}
    </div>
  );
}
