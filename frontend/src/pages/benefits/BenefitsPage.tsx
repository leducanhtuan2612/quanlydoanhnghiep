import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/benefits";

export default function AdminBenefitsPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");

  const [programs, setPrograms] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await fetch(API_URL);
    setPrograms(await res.json());
  };

  const create = async () => {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: desc,
        registration_start: start,
        registration_end: end,
        location,
      }),
    });
    load();
    setTitle("");
    setDesc("");
    setStart("");
    setEnd("");
    setLocation("");
  };

  const closeProgram = async (id: number) => {
    await fetch(`${API_URL}/${id}/close`, { method: "PUT" });
    load();
  };

  const remove = async (id: number) => {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="p-6 space-y-6">
<button
  onClick={() => navigate(`/employees/profile/${employeeId}`)}
  className="inline-flex items-center gap-2 text-slate-600 hover:text-black"
>
  <ArrowLeft size={18} />
  Quay lại hồ sơ nhân viên
</button>




      <h1 className="text-3xl font-bold text-slate-800">
        Quản lý chương trình phúc lợi
      </h1>

      {/* Form */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-4">Thêm chương trình mới</h2>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tên chương trình"
          className="w-full p-3 border rounded mb-3"
        />

        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Mô tả"
          className="w-full p-3 border rounded mb-3"
        />

        <div className="grid grid-cols-2 gap-4 mb-3">
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="p-3 border rounded"
          />
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="p-3 border rounded"
          />
        </div>

        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Địa điểm"
          className="w-full p-3 border rounded mb-3"
        />

        <button
          onClick={create}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Thêm chương trình
        </button>
      </div>

      {/* LIST */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Danh sách chương trình</h2>

        {programs.map((p) => (
          <div
            key={p.id}
            className="border p-4 rounded mb-4 flex justify-between items-center"
          >
            <div>
              <h3 className="font-bold text-lg">{p.title}</h3>
              <p>{p.description}</p>
              <p className="text-sm text-slate-600">
                {p.registration_start} → {p.registration_end}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => closeProgram(p.id)}
                className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Đóng lại
              </button>

              <button
                onClick={() => remove(p.id)}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
              >
                <Trash size={16} />
                Xoá
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
