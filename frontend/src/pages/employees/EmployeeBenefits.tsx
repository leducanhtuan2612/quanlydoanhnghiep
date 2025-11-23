import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/benefits";
const EMP_API = "http://127.0.0.1:8000/employees";

export default function EmployeeBenefits() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<any>(null);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployee();
    fetchBenefits();
  }, []);

  const fetchEmployee = async () => {
    const res = await fetch(`${EMP_API}/${id}`);
    const data = await res.json();
    setEmployee(data);
  };

  const fetchBenefits = async () => {
    const res = await fetch(`${API_URL}?employee_id=${id}`);
    const data = await res.json();
    setBenefits(data);
    setLoading(false);
  };

  const register = async (benefitId: number) => {
    await fetch(`${API_URL}/${benefitId}/register?employee_id=${id}`, {
      method: "POST",
    });
    fetchBenefits();
  };

  const cancel = async (benefitId: number) => {
    await fetch(`${API_URL}/${benefitId}/register?employee_id=${id}`, {
      method: "DELETE",
    });
    fetchBenefits();
  };

  if (!employee) return <div className="p-6">Đang tải...</div>;

  const avatarUrl = employee.avatar
    ? `http://127.0.0.1:8000${employee.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        employee.name
      )}&size=220&background=f3f4f6&color=0f172a`;

  return (
    <div className="flex w-full">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r h-screen p-4 space-y-4 sticky top-0">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Nhân viên</h2>

        <div className="space-y-2 text-slate-700 text-sm font-medium">
          <MenuItem label="Hồ sơ" onClick={() => navigate(`/employees/profile/${id}`)} />
          <MenuItem label="Chấm công" onClick={() => navigate(`/attendance/${id}`)} />

          {/* FIX HERE: điều hướng đúng sang trang lương */}
          <MenuItem 
            label="Tiền lương" 
            onClick={() => navigate(`/employees/salary/${id}`)} 
          />

          <MenuItem label="Phúc lợi" active />
            <MenuItem label="Hợp đồng" onClick={() => navigate(`/employees/${id}/contracts`)} />
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

        {/* Banner */}
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
  <p className="text-slate-500">Chương trình phúc lợi</p>
</div>


        {/* Add Benefit (Admin Only) */}
        <div className="mt-6 px-6 flex justify-end">
          {localStorage.getItem("role") === "admin" && (
            <button
              onClick={() => navigate(`/admin/benefits/${id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Thêm phúc lợi
            </button>
          )}
        </div>

        {/* Benefit List */}
      <div className="px-6 py-10 ml-6">
  <div className="bg-white border rounded-xl p-8 shadow-sm">


            <h3 className="font-semibold text-lg mb-6">Danh sách chương trình</h3>

            {loading ? (
              <div className="text-center py-6 text-slate-500">Đang tải...</div>
            ) : benefits.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                Không có chương trình nào
              </div>
            ) : (
              <div className="space-y-6">
                {benefits.map((b) => (
                  <div key={b.id} className="border rounded-lg p-4 shadow-sm bg-slate-50">

                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-lg">{b.title}</h4>

                      {b.status === "open" ? (
                        !b.is_registered ? (
                          <button
                            onClick={() => register(b.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Đăng ký
                          </button>
                        ) : (
                          <button
                            onClick={() => cancel(b.id)}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                          >
                            Hủy đăng ký
                          </button>
                        )
                      ) : (
                        <span className="text-slate-400">Đã đóng</span>
                      )}
                    </div>

                    <p className="text-slate-700 mt-2 whitespace-pre-line">
                      {b.description}
                    </p>

                    <div className="flex gap-6 mt-3 text-sm text-slate-600">
                      <div>
                        <strong>Bắt đầu:</strong>{" "}
                        {b.registration_start
                          ? new Date(b.registration_start).toLocaleDateString("vi-VN")
                          : "—"}
                      </div>
                      <div>
                        <strong>Kết thúc:</strong>{" "}
                        {b.registration_end
                          ? new Date(b.registration_end).toLocaleDateString("vi-VN")
                          : "—"}
                      </div>
                      <div>
                        <strong>Địa điểm:</strong> {b.location || "—"}
                      </div>
                    </div>

                    {b.is_registered && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        <Check size={16} /> Đã đăng ký
                      </div>
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
