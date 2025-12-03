import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, UploadCloud } from "lucide-react";

const API = "http://127.0.0.1:8000";

type Attachment = {
  id: number;
  file_name: string;
  file_path: string;
  uploaded_at: string;
};

type Task = {
  id: number;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  progress: number;
  deadline?: string | null;
  assigned_to_id?: number | null;
  assigned_to_name?: string | null;
  created_at: string;
  updated_at: string;
  attachments: Attachment[];
};

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("todo");
  const [uploading, setUploading] = useState(false);

  const fetchTask = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`${API}/tasks/${id}`);
      const data = await res.json();
      setTask(data);
      setProgress(data.progress || 0);
      setStatus(data.status || "todo");
    } catch (err) {
      console.error("Lỗi tải task:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdateProgress = async () => {
    if (!id) return;
    try {
      const params = new URLSearchParams();
      params.append("progress", String(progress));
      if (status) params.append("status", status);

      const res = await fetch(`${API}/tasks/${id}/progress?${params.toString()}`, {
        method: "POST",
      });
      const data = await res.json();
      setTask(data);
    } catch (err) {
      console.error("Lỗi cập nhật tiến độ:", err);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);

    try {
      setUploading(true);
      const res = await fetch(`${API}/tasks/${id}/upload`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      setTask((prev) =>
        prev ? { ...prev, attachments: [...prev.attachments, data] } : prev
      );
    } catch (err) {
      console.error("Lỗi upload file:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (loading || !task) {
    return (
      <div className="p-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
        <p>Đang tải dữ liệu công việc...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={16} /> Quay lại danh sách công việc
      </button>

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <ClipboardList size={24} className="text-blue-600" />
            {task.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ưu tiên:{" "}
            <span className="font-medium text-slate-700">
              {task.priority === "high"
                ? "Cao"
                : task.priority === "medium"
                ? "Trung bình"
                : "Thấp"}
            </span>{" "}
            · Trạng thái:{" "}
            <span className="font-medium text-slate-700">
              {task.status === "done"
                ? "Hoàn thành"
                : task.status === "in_progress"
                ? "Đang làm"
                : "Chưa làm"}
            </span>
          </p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <div>
            Tạo lúc:{" "}
            {new Date(task.created_at).toLocaleString("vi-VN")}
          </div>
          <div>
            Cập nhật:{" "}
            {new Date(task.updated_at).toLocaleString("vi-VN")}
          </div>
        </div>
      </div>

      {/* GRID 2 CỘT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: THÔNG TIN & TIẾN ĐỘ */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-1">
              Mô tả công việc
            </h2>
            <p className="text-sm text-slate-700 whitespace-pre-line">
              {task.description || "Chưa có mô tả."}
            </p>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 font-medium">
                  Tiến độ hiện tại
                </span>
                <span className="text-sm text-slate-600">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full"
              />

              <div className="flex items-center gap-3 mt-3">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="todo">Chưa làm</option>
                  <option value="in_progress">Đang làm</option>
                  <option value="done">Hoàn thành</option>
                </select>
                <button
                  onClick={handleUpdateProgress}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm shadow"
                >
                  Lưu tiến độ
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: THÔNG TIN PHỤ & FILE */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3 text-sm text-slate-700">
            <h2 className="text-sm font-semibold text-slate-800 mb-1">
              Thông tin chung
            </h2>
            <div>
              <span className="text-slate-500">Deadline: </span>
              <span className="font-medium">
                {task.deadline
                  ? new Date(task.deadline).toLocaleDateString("vi-VN")
                  : "Chưa đặt"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Nhân viên phụ trách: </span>
              <span className="font-medium">
                {task.assigned_to_name || "Chưa phân công"}
              </span>
            </div>
          </div>

          {/* ATTACHMENTS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">
                File đính kèm
              </h2>
              <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 cursor-pointer">
                <UploadCloud size={14} />
                {uploading ? "Đang tải..." : "Thêm file"}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            {task.attachments.length === 0 && (
              <p className="text-slate-500 text-xs">
                Chưa có file đính kèm.
              </p>
            )}

            {task.attachments.length > 0 && (
              <ul className="space-y-2">
                {task.attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50"
                  >
                    <div className="flex-1">
                      <div className="text-xs font-medium text-slate-800">
                        {a.file_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(a.uploaded_at).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <a
                      href={`http://127.0.0.1:8000${a.file_path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline ml-3"
                    >
                      Tải xuống
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
