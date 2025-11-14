import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/employees";

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [emp, setEmp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployee();
  }, []);

  const fetchEmployee = async () => {
    try {
      const res = await fetch(`${API_URL}/${id}`);
      const data = await res.json();
      setEmp(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    const form = new FormData();
    form.append("file", file);

    await fetch(`${API_URL}/upload-avatar/${id}`, {
      method: "POST",
      body: form,
    });

    fetchEmployee();
  };

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (!emp) return <div className="p-6">Không tìm thấy nhân viên</div>;

  const avatarUrl = emp.avatar
    ? `http://127.0.0.1:8000${emp.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        emp.name
      )}&size=260&background=f3f4f6&color=0f172a`;

  return (
    <div className="flex w-full">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r h-screen p-4 space-y-4 sticky top-0">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Nhân viên</h2>

        <div className="space-y-2 text-slate-700 text-sm font-medium">
          <MenuItem label="Hồ sơ" active />
          <MenuItem label="Chấm công" onClick={() => navigate(`/attendance/${id}`)} />
          <MenuItem label="Tiền lương" />
          <MenuItem label="Phúc lợi" onClick={() => navigate(`/benefits/${id}`)} />
          <MenuItem label="Đồng phục" />
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 bg-slate-50 min-h-screen overflow-auto">

        {/* Back button */}
        <div className="p-6">
          <button
            onClick={() => navigate("/employees")}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-black"
          >
            <ArrowLeft size={18} />
            Quay lại danh sách
          </button>
        </div>

        {/* BANNER + AVATAR */}
        <div className="relative w-full mx-6">

          {/* Banner */}
          <div className="w-full h-60 rounded-xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Avatar */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-28 z-[200]">
            <div className="relative">
              <img
                src={avatarUrl}
                className="w-64 h-64 rounded-full border-[8px] border-white shadow-2xl object-cover"
              />

              <label className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full cursor-pointer shadow-lg">
                <Pencil size={20} />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files && uploadAvatar(e.target.files[0])
                  }
                />
              </label>
            </div>
          </div>
        </div>

        {/* NAME */}
        <div className="mt-36 text-center space-y-1">
          <h1 className="text-3xl font-bold text-slate-800">{emp.name}</h1>

          <div className="flex justify-center mt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
              <Pencil size={16} />
              Cập nhật thông tin
            </button>
          </div>
        </div>

        {/* INFO */}
        <div className="px-6 py-14">
          <div className="bg-white border rounded-xl p-8 shadow-sm">

            <h3 className="font-semibold text-lg mb-6">Thông tin cơ bản</h3>

            <div className="grid grid-cols-2 gap-6 text-[15px] text-slate-700">
              <Info label="Tên" value={emp.name} />
              <Info label="Giới tính" value={emp.gender} />

              <Info label="Ngày sinh" value={emp.birthday} />
              <Info label="Điện thoại" value={emp.phone} />

              <Info label="Email" value={emp.email} />
              <Info label="Chức vụ" value={emp.position} />

              <Info label="Phòng ban" value={emp.department} />
              <Info label="Địa chỉ" value={emp.address} />

              <Info label="CCCD/CMND" value={emp.citizen_id} />
              <Info label="Ghi chú" value={emp.notes || "—"} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* MENU ITEM */
function MenuItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`px-3 py-2 rounded-lg cursor-pointer transition ${
        active
          ? "bg-blue-600 text-white shadow"
          : "hover:bg-slate-100 text-slate-700"
      }`}
    >
      {label}
    </div>
  );
}

/* INFO ITEM */
function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-medium text-slate-800 mt-1">{value || "—"}</p>
    </div>
  );
}
