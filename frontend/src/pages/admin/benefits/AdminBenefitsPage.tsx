import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const API = "http://127.0.0.1:8000/benefits";

export default function AdminBenefitsPage() {
  const navigate = useNavigate();

  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    registration_start: "",
    registration_end: "",
    location: "",
    status: "open",
  });

  /** Load danh sách */
  const fetchPrograms = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setPrograms(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  /** THÊM chương trình */
  const createProgram = async () => {
    if (!form.title.trim()) {
      alert("Tên chương trình không được để trống!");
      return;
    }

    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setForm({
      title: "",
      description: "",
      registration_start: "",
      registration_end: "",
      location: "",
      status: "open",
    });

    fetchPrograms();
    alert("Đã thêm chương trình phúc lợi!");
  };

  /** ĐÓNG CHƯƠNG TRÌNH */
  const closeProgram = async (id: number) => {
    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    fetchPrograms();
  };

  /** XOÁ chương trình */
  const deleteProgram = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xoá chương trình này?")) return;

    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchPrograms();
  };

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 space-y-6">

      {/* QUAY LẠI */}
      <button
        onClick={() => navigate("/employees")}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-black"
      >
        <ArrowLeft size={18} />
        Quay lại
      </button>

      <h1 className="text-2xl font-semibold">Quản lý chương trình phúc lợi</h1>

      {/* FORM THÊM */}
      <div className="bg-white p-6 rounded-xl border space-y-4 shadow-sm">

        <h2 className="text-lg font-semibold">Thêm chương trình mới</h2>

        <input
          type="text"
          placeholder="Tên chương trình"
          className="border p-2 w-full rounded"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <textarea
          placeholder="Mô tả"
          className="border p-2 w-full rounded"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-medium">Ngày bắt đầu</label>
            <input
              type="date"
              className="border p-2 w-full rounded"
              value={form.registration_start}
              onChange={(e) =>
                setForm({ ...form, registration_start: e.target.value })
              }
            />
          </div>

          <div>
            <label className="font-medium">Ngày kết thúc</label>
            <input
              type="date"
              className="border p-2 w-full rounded"
              value={form.registration_end}
              onChange={(e) =>
                setForm({ ...form, registration_end: e.target.value })
              }
            />
          </div>
        </div>

        <input
          type="text"
          placeholder="Địa điểm"
          className="border p-2 w-full rounded"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={createProgram}
        >
          Thêm chương trình
        </button>
      </div>

      {/* DANH SÁCH */}

      <div className="bg-white border p-6 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Danh sách chương trình</h2>

        {programs.length === 0 ? (
          <p className="text-slate-500">Chưa có chương trình nào.</p>
        ) : (
          <ul className="space-y-4">

            {programs.map((p) => (
              <li
                key={p.id}
                className="border p-4 rounded-lg bg-slate-50 hover:bg-white transition shadow-sm"
              >
                <div className="flex justify-between items-start">

                  {/* INFO */}
                  <div>
                    <h3 className="font-semibold text-slate-800">{p.title}</h3>

                    <p className="text-slate-600 text-sm">{p.description}</p>

                    <p className="text-sm text-slate-500 mt-1">
                      📅 {p.registration_start} → {p.registration_end}
                    </p>

                    <p className="text-sm text-slate-500">📍 {p.location}</p>

                    <p className="text-sm mt-1">
                      Trạng thái:{" "}
                      <span
                        className={
                          p.status === "open"
                            ? "text-green-600 font-semibold"
                            : "text-red-600 font-semibold"
                        }
                      >
                        {p.status === "open" ? "Đang mở" : "Đã đóng"}
                      </span>
                    </p>
                  </div>

                  {/* ACTIONS */}
                  <div className="space-x-3">
                    {p.status === "open" && (
                      <button
                        onClick={() => closeProgram(p.id)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Đóng lại
                      </button>
                    )}

                    <button
                      onClick={() => deleteProgram(p.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Xoá
                    </button>
                  </div>

                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
