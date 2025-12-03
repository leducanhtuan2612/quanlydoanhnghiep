import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api";
import {
  AlertTriangle,
  Loader2,
  Clock,
  CheckCircle,
} from "lucide-react";

type Task = {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  progress: number;
  deadline: string | null;
};

export default function EmployeeTaskList() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const employeeId = user.employee_id;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTasks() {
    try {
      const res = await api.get(`/tasks?employee_id=${employeeId}`);
      setTasks(res.data);
    } catch (err) {
      console.error("Lỗi lấy task:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  if (loading) {
    return (
      <div className="loading-box">
        <Loader2 size={26} className="animate-spin" />
        <span className="ml-2">Đang tải công việc...</span>
      </div>
    );
  }

  return (
    <div className="page-container">

      <h2 className="title mb-5">📋 Công việc của tôi</h2>

      <div className="space-y-4">
        {tasks.length === 0 && (
          <p className="text-gray-500 text-center mt-10">
            Bạn chưa có công việc nào.
          </p>
        )}

        {tasks.map((task) => {
          const isLate =
            task.deadline &&
            task.status !== "done" &&
            new Date(task.deadline) < new Date();

          return (
            <Link
              key={task.id}
              to={`/employee/tasks/${task.id}`}
              className="block bg-white shadow-sm hover:shadow-md transition border rounded-xl p-5 group"
            >
              {/* Title */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-blue-600 transition">
                    {task.title}
                  </h3>

                  <p className="text-gray-600 text-sm mt-1">
                    {task.description}
                  </p>
                </div>

                {/* Status */}
                <span
                  className={`px-3 py-1 text-xs rounded-full ${
                    task.status === "done"
                      ? "bg-green-100 text-green-700"
                      : task.status === "in_progress"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {task.status === "done"
                    ? "Hoàn thành"
                    : task.status === "in_progress"
                    ? "Đang làm"
                    : "Chưa làm"}
                </span>
              </div>

              {/* Info */}
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="text-gray-700">
                  Ưu tiên:{" "}
                  <strong className="capitalize">{task.priority}</strong>
                </span>

                <span className="flex items-center gap-1 text-gray-700">
                  <Clock size={15} />
                  {task.deadline || "Không có deadline"}
                </span>

                {isLate && (
                  <span className="flex items-center text-red-600 gap-1 font-medium">
                    <AlertTriangle size={16} /> Trễ deadline
                  </span>
                )}

                {task.status === "done" && (
                  <span className="flex items-center text-green-600 gap-1 font-medium">
                    <CheckCircle size={16} /> Hoàn thành
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tiến độ</span>
                  <span>{task.progress}%</span>
                </div>

                <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                  <div
                    className="h-2 bg-blue-600 rounded-full transition-all"
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
