import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, X, Plus } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/benefits";

export default function BenefitsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const role = localStorage.getItem("role");
  const isAdmin = role === "admin";

  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  useEffect(() => {
    fetchBenefits();
  }, []);

  const fetchBenefits = async () => {
    const res = await fetch(`${API_URL}?employee_id=${id}`);
    const data = await res.json();
    setPrograms(data);
    setLoading(false);
  };

  const openRegister = (program: any) => {
    setSelectedProgram(program);
    setShowModal(true);
  };

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate(`/employees/${id}`)}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-black"
      >
        <ArrowLeft size={18} />
        Quay lại hồ sơ nhân viên
      </button>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Phúc lợi nhân viên</h1>

        {isAdmin && (
          <button
            onClick={() => navigate("/admin/benefits")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Thêm phúc lợi
          </button>
        )}
      </div>

      {/* LIST */}
      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-10">
        {/* MỞ */}
        <SectionTitle title="Chương trình phúc lợi đang mở" />

        {programs.filter(p => p.status === "open").length === 0 ? (
          <p className="text-slate-500 italic">
            Hiện không có chương trình phúc lợi nào đang mở.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {programs
              .filter(p => p.status === "open")
              .map((p) => (
                <ProgramCard
                  key={p.id}
                  program={p}
                  onRegister={() => openRegister(p)}
                />
              ))}
          </div>
        )}

        {/* ĐÃ ĐĂNG KÝ */}
        <SectionTitle title="Chương trình đã đăng ký" />

        {programs.filter(p => p.is_registered).length === 0 ? (
          <p className="text-slate-500 italic">
            Bạn chưa đăng ký chương trình nào.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {programs
              .filter(p => p.is_registered)
              .map((p) => (
                <ProgramCard key={p.id} program={p} hideButton />
              ))}
          </div>
        )}

        {/* ĐÓNG */}
        <SectionTitle title="Lịch sử chương trình đã đóng" />

        {programs.filter(p => p.status === "closed").length === 0 ? (
          <p className="text-slate-500 italic">Không có chương trình đã kết thúc.</p>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {programs
              .filter(p => p.status === "closed")
              .map((p) => (
                <ProgramCard key={p.id} program={p} hideButton />
              ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <RegisterModal
          program={selectedProgram}
          employeeId={id}
          onClose={() => setShowModal(false)}
          refresh={fetchBenefits}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* COMPONENTS */
/* ---------------------------------------------------------------------- */

function ProgramCard({ program, onRegister, hideButton }: any) {
  return (
    <div className="border rounded-lg p-5 bg-slate-50 hover:bg-white transition shadow-sm">
      <h3 className="font-semibold text-lg text-slate-800">{program.title}</h3>
      <p className="text-slate-600 mt-2 text-sm">{program.description}</p>

      {!hideButton && (
        !program.is_registered ? (
          <button
            onClick={onRegister}
            className="mt-5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Đăng ký tham gia
          </button>
        ) : (
          <div className="mt-4 px-4 py-2 bg-green-100 text-green-700 text-center rounded-lg">
            Đã đăng ký
          </div>
        )
      )}
    </div>
  );
}

function SectionTitle({ title }: any) {
  return (
    <h2 className="text-xl font-semibold text-slate-800 border-l-4 border-blue-600 pl-3">
      {title}
    </h2>
  );
}

/* ---------------------------------------------------------------------- */
/* MODAL ĐĂNG KÝ */
/* ---------------------------------------------------------------------- */

function RegisterModal({ program, employeeId, onClose, refresh }: any) {
  const sendRegister = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/benefits/${program.id}/register?employee_id=${employeeId}`,
        { method: "POST" }
      );

      if (!res.ok) {
        const error = await res.json();
        alert(error.detail || "Lỗi đăng ký");
        return;
      }

      alert("Đăng ký thành công!");
      onClose();
      refresh();
    } catch (err) {
      alert("Không thể gửi đăng ký");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[500]">
      <div className="bg-white w-[450px] p-6 rounded-xl shadow-xl animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">
            Đăng ký tham gia: {program.title}
          </h3>

          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <p className="text-slate-600 text-sm mb-3">
          Gửi yêu cầu đăng ký tham gia chương trình phúc lợi.
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
          >
            Hủy
          </button>

          <button
            onClick={sendRegister}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Gửi đăng ký
          </button>
        </div>
      </div>
    </div>
  );
}
