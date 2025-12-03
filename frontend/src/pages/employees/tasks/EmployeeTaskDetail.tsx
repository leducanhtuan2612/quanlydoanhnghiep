import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../api";
import {
  Loader2,
  CalendarDays,
  Upload,
  FileText,
  CheckCircle,
  ArrowLeft,
  AlertTriangle,
  Clock3,
  User,
} from "lucide-react";

export default function EmployeeTaskDetail() {
  const { id } = useParams();
  const [task, setTask] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("in_progress");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadTask() {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data);
      setProgress(res.data.progress);
      setStatus(res.data.status);
    } finally {
      setLoading(false);
    }
  }

  async function saveProgress() {
    await api.post(`/tasks/${id}/progress`, null, {
      params: { progress, status },
    });

    alert("Đã cập nhật tiến độ!");
    loadTask();
  }

  async function uploadFile() {
    if (!file) return alert("Chưa chọn file");

    const form = new FormData();
    form.append("file", file);

    await api.post(`/tasks/${id}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    alert("Tải file thành công!");
    loadTask();
  }

  useEffect(() => {
    loadTask();
  }, []);

  if (loading || !task) {
    return (
      <div className="flex justify-center mt-20 text-gray-600">
        <Loader2 size={30} className="animate-spin" />
      </div>
    );
  }

  // ========================
  // 🔥 TÍNH TOÁN UI DEADLINE
  // ========================
  const today = new Date();
  const deadlineDate = task.deadline ? new Date(task.deadline) : null;

  let deadlineLabel = "Không có deadline";
  let deadlineColor = "text-gray-600";

  if (deadlineDate) {
    const diff = deadlineDate.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    deadlineLabel = deadlineDate.toLocaleDateString("vi-VN");

    if (task.status !== "done") {
      if (days < 0) {
        deadlineColor = "text-red-600";
      } else if (days <= 2) {
        deadlineColor = "text-amber-500";
      } else {
        deadlineColor = "text-emerald-600";
      }
    }
  }

  return (
    <div className="page-container max-w-4xl mx-auto p-4">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <ArrowLeft
          className="text-gray-600 cursor-pointer hover:text-gray-800"
          size={22}
          onClick={() => window.history.back()}
        />
        <h2 className="text-xl font-semibold">Chi tiết công việc</h2>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white shadow-md p-8 rounded-2xl space-y-8">

        {/* TITLE + DESCRIPTION */}
        <div>
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText size={24} className="text-blue-600" />
            {task.title}
          </h3>
          <p className="text-gray-600 mt-2">{task.description}</p>
        </div>

        {/* DEADLINE + ASSIGNEE */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* DEADLINE */}
          <div className="p-4 border rounded-xl bg-gray-50">
            <h4 className="font-medium text-gray-700 flex items-center gap-2 mb-2">
              <CalendarDays size={18} className="text-blue-600" />
              Deadline
            </h4>
            <p className={`text-lg font-semibold ${deadlineColor}`}>
              {deadlineLabel}
            </p>

            {task.status !== "done" && deadlineDate && (
              <>
                {deadlineDate < today && (
                  <p className="text-red-600 mt-1 flex gap-1 items-center text-sm">
                    <AlertTriangle size={14} /> Trễ hạn
                  </p>
                )}

                {deadlineDate > today &&
                  deadlineDate.getTime() - today.getTime() <=
                    2 * 86400000 && (
                    <p className="text-amber-500 mt-1 flex gap-1 items-center text-sm">
                      <Clock3 size={14} /> Sắp trễ hạn
                    </p>
                  )}
              </>
            )}
          </div>

          {/* ASSIGNED */}
          <div className="p-4 border rounded-xl bg-gray-50">
            <h4 className="font-medium text-gray-700 flex items-center gap-2 mb-2">
              <User size={18} className="text-blue-600" /> Nhân viên thực hiện
            </h4>
            <p className="text-lg font-semibold text-gray-800">
              {task.assigned_to_name || "Không có"}
            </p>
          </div>
        </div>

        {/* STATUS + PROGRESS */}
        <div className="space-y-6">
          <div>
            <label className="font-medium text-gray-700">Trạng thái</label>
            <select
              className="border p-3 rounded-xl w-full mt-1 bg-gray-50"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="todo">Chưa làm</option>
              <option value="in_progress">Đang làm</option>
              <option value="done">Hoàn thành</option>
            </select>
          </div>

          <div>
            <label className="font-medium text-gray-700">Tiến độ (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              className="border p-3 rounded-xl w-full mt-1 bg-gray-50"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
            />

            {/* Progress bar */}
            <div className="w-full h-3 bg-gray-200 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  progress === 100
                    ? "bg-emerald-500"
                    : progress >= 70
                    ? "bg-blue-500"
                    : "bg-amber-400"
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <button
            onClick={saveProgress}
            className="mt-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 shadow"
          >
            <CheckCircle size={18} />
            Lưu tiến độ
          </button>
        </div>

        {/* FILE ATTACHMENTS */}
        <div className="pt-6 border-t">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <FileText size={20} className="text-blue-600" />
            File đính kèm
          </h4>

          <div className="space-y-2">
            {task.attachments?.length === 0 && (
              <p className="text-gray-500">Không có file nào.</p>
            )}

            {task.attachments?.map((f: any) => (
              <div
                key={f.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border"
              >
                <span className="flex items-center gap-2 text-gray-700">
                  <FileText size={18} className="text-blue-600" />
                  {f.file_name}
                </span>

                <a
                  href={f.file_path}
                  download
                  className="text-blue-600 hover:underline font-medium"
                >
                  Tải xuống
                </a>
              </div>
            ))}
          </div>

          {/* Upload */}
          <div className="mt-4">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block"
            />

            <button
              onClick={uploadFile}
              className="mt-3 px-4 py-2 border rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center gap-2"
            >
              <Upload size={18} /> Tải lên
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
