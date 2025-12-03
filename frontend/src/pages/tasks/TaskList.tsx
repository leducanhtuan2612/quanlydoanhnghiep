import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ListTodo,
  Plus,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  Loader2,
  Filter,
  Edit3,
  Trash2,
  User,
  CalendarClock,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

// ======================
// TYPES
// ======================
type TaskStatus = "todo" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high";

type Attachment = {
  id: number;
  file_name: string;
  file_path: string;
};

type Task = {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  deadline?: string | null;
  assigned_to_id?: number | null;
  assigned_to_name?: string | null;
  attachments?: Attachment[];
};

type EmployeeItem = { id: number; name: string };

// ======================
// HELPERS
// ======================
function clampProgress(v: number | undefined | null) {
  if (v == null || Number.isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 100) return 100;
  return v;
}

function formatDate(d?: string | null) {
  if (!d) return "--";
  const iso = d.slice(0, 10); // YYYY-MM-DD
  const [y, m, day] = iso.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

function addDaysIso(baseIso: string, days: number) {
  const date = new Date(baseIso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

// ===============================================================
// MAIN COMPONENT
// ===============================================================
export default function TaskList() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role: string = user.role || "employee";
  const employeeId: number | null = user.employee_id || null;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // EMPLOYEE LIST
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);

  useEffect(() => {
    // nếu bạn đã có /employees riêng thì giữ nguyên,
    // còn nếu dùng router trong tasks.py thì đổi thành `${API}/tasks/employees`
    fetch(`${API}/employees`)
      .then((res) => res.json())
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => console.log("Lỗi tải danh sách nhân viên"));
  }, []);

  // FILTERS
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [priorityFilter, setPriorityFilter] =
    useState<"all" | TaskPriority>("all");

  // MODAL STATES
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  // FILE UPLOAD STATE
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // FORM
  const emptyForm = {
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    status: "todo" as TaskStatus,
    progress: 0,
    deadline: "",
    assigned_to_id: "",
    attachments: [] as Attachment[],
  };

  const [form, setForm] = useState({ ...emptyForm });

  // ======================
  // LOAD TASKS
  // ======================
  const fetchTasks = async () => {
    try {
      setLoading(true);

      // 🔧 Đúng với backend: list_tasks(employee_id: Optional[int] = None, ...)
      const query =
        role === "employee" && employeeId ? `?employee_id=${employeeId}` : "";

      const res = await fetch(`${API}/tasks${query}`);
      const data = await res.json();

      setTasks(Array.isArray(data) ? data : []);
    } catch {
      console.log("Lỗi tải danh sách công việc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ======================
  // SUMMARY (tổng quan)
  // ======================
  const { total, todo, doing, done, overdue, warning } = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
    const warningBoundary = addDaysIso(todayIso, 2);

    let _todo = 0,
      _inprogress = 0,
      _done = 0,
      _late = 0,
      _warning = 0;

    tasks.forEach((t) => {
      if (t.status === "todo") _todo++;
      else if (t.status === "in_progress") _inprogress++;
      else if (t.status === "done") _done++;

      if (t.deadline) {
        const d = t.deadline.slice(0, 10);

        if (t.status !== "done") {
          // trễ hạn
          if (d < todayIso) {
            _late++;
          } else if (d >= todayIso && d <= warningBoundary) {
            // sắp trễ hạn (trong vòng 2 ngày tới)
            _warning++;
          }
        }
      }
    });

    return {
      total: tasks.length,
      todo: _todo,
      doing: _inprogress,
      done: _done,
      overdue: _late,
      warning: _warning,
    };
  }, [tasks]);

  // ======================
  // FILTERED LIST
  // ======================
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter)
        return false;
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  // ======================
  // OPEN/CLOSE MODAL
  // ======================
  const openCreateModal = () => {
    setForm({ ...emptyForm });
    setCurrentTask(null);
    setUploadFile(null);
    setOpenCreate(true);
  };

  const openEditModal = (task: Task) => {
    setCurrentTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      progress: clampProgress(task.progress),
      deadline: task.deadline ? task.deadline.slice(0, 10) : "",
      assigned_to_id: task.assigned_to_id ? String(task.assigned_to_id) : "",
      attachments: task.attachments || [],
    });
    setUploadFile(null);
    setOpenEdit(true);
  };

  const closeModals = () => {
    setOpenCreate(false);
    setOpenEdit(false);
    setUploadFile(null);
    setForm({ ...emptyForm });
    setCurrentTask(null);
  };

  // ======================
  // CREATE TASK
  // ======================
  const handleCreateTask = async () => {
    if (!form.title.trim()) {
      alert("Vui lòng nhập tiêu đề");
      return;
    }

    try {
      setCreating(true);

      let progress = clampProgress(Number(form.progress) || 0);

      // Nếu chọn trạng thái Hoàn thành mà progress < 100 thì auto = 100
      if (form.status === "done" && progress < 100) {
        progress = 100;
      }

      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        status: form.status,
        progress,
        deadline: form.deadline || null,
      };

      // Nhân viên: tự gán cho chính mình
      if (role === "employee" && employeeId) {
        payload.assigned_to_id = employeeId;
      }

      // Admin: cho phép chọn nhân viên
      if (role === "admin" && form.assigned_to_id) {
        payload.assigned_to_id = Number(form.assigned_to_id);
      }

      const res = await fetch(`${API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        alert("Không thể tạo công việc");
        return;
      }

      closeModals();
      await fetchTasks();
    } catch (err) {
      console.error("Lỗi tạo công việc:", err);
      alert("Đã xảy ra lỗi khi tạo công việc");
    } finally {
      setCreating(false);
    }
  };

  // ======================
  // UPDATE TASK
  // ======================
  const handleUpdateTask = async () => {
    if (!currentTask) return;

    if (!form.title.trim()) {
      alert("Vui lòng nhập tiêu đề");
      return;
    }

    try {
      setEditing(true);

      let progress = clampProgress(Number(form.progress));

      if (form.status === "done" && progress < 100) {
        progress = 100;
      }

      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        status: form.status,
        progress,
        deadline: form.deadline || null,
      };

      if (role === "admin" && form.assigned_to_id) {
        payload.assigned_to_id = Number(form.assigned_to_id);
      }

      const res = await fetch(`${API}/tasks/${currentTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        alert("Không thể cập nhật công việc");
        return;
      }

      closeModals();
      await fetchTasks();
    } catch (err) {
      console.error("Lỗi cập nhật công việc:", err);
      alert("Đã xảy ra lỗi khi cập nhật công việc");
    } finally {
      setEditing(false);
    }
  };

  // ======================
  // DELETE TASK
  // ======================
  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`Xoá công việc "${task.title}"?`)) return;

    try {
      const res = await fetch(`${API}/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Không thể xoá công việc");
        return;
      }

      await fetchTasks();
    } catch (err) {
      console.error("Lỗi xoá công việc:", err);
      alert("Đã xảy ra lỗi khi xoá công việc");
    }
  };

  // ======================
  // TAG HELPERS
  // ======================
  const renderPriorityTag = (p: TaskPriority) => {
    const base =
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium";

    if (p === "high")
      return (
        <span className={`${base} bg-red-100 text-red-700 border border-red-200`}>
          🔥 Cao
        </span>
      );

    if (p === "medium")
      return (
        <span
          className={`${base} bg-amber-100 text-amber-700 border border-amber-200`}
        >
          ⚡ Trung bình
        </span>
      );

    return (
      <span className={`${base} bg-slate-100 text-slate-700 border border-slate-200`}>
        ⬇ Thấp
      </span>
    );
  };

  const renderStatusTag = (s: TaskStatus) => {
    const base =
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium";

    if (s === "todo")
      return (
        <span className={`${base} bg-slate-100 text-slate-700 border border-slate-200`}>
          ⏳ Chưa làm
        </span>
      );

    if (s === "in_progress")
      return (
        <span className={`${base} bg-blue-100 text-blue-700 border border-blue-200`}>
          🔄 Đang làm
        </span>
      );

    return (
      <span className={`${base} bg-emerald-100 text-emerald-700 border border-emerald-200`}>
        ✅ Hoàn thành
      </span>
    );
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  // ======================
  // UI
  // ======================
  return (
    <div className="p-8 pb-16 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-slate-700">
            <ListTodo className="text-blue-500" />
            <h1 className="text-xl font-semibold">Công việc của bạn</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi nhiệm vụ hằng ngày trong hệ thống quản lý doanh nghiệp.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 shadow-sm"
        >
          <Plus size={16} />
          Thêm công việc
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard
          title="Tổng công việc"
          value={total}
          icon={<ListTodo className="text-blue-500" size={20} />}
        />
        <SummaryCard
          title="Chưa làm"
          value={todo}
          icon={<Clock3 className="text-slate-500" size={20} />}
        />
        <SummaryCard
          title="Đang thực hiện"
          value={doing}
          icon={<Loader2 className="text-amber-500" size={20} />}
          variant={doing > 0 ? "warning" : "default"}
        />
        <SummaryCard
          title="Sắp trễ hạn"
          value={warning}
          icon={<AlertTriangle className="text-amber-500" size={20} />}
          variant={warning > 0 ? "warning" : "default"}
        />
        <SummaryCard
          title="Trễ deadline"
          value={overdue}
          icon={<AlertTriangle className="text-red-500" size={20} />}
          variant={overdue > 0 ? "danger" : "default"}
        />
      </div>

      {/* FILTERS */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex-1 flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề..."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center text-sm">
          <Filter size={16} className="text-slate-500" />
          <span className="text-slate-500">Lọc:</span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="todo">Chưa làm</option>
            <option value="in_progress">Đang làm</option>
            <option value="done">Hoàn thành</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <option value="all">Mọi ưu tiên</option>
            <option value="high">Ưu tiên cao</option>
            <option value="medium">Ưu tiên trung bình</option>
            <option value="low">Ưu tiên thấp</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <ListTodo size={16} />
            Danh sách công việc
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <CalendarClock size={14} />
            Hôm nay: {formatDate(todayIso)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-xs text-slate-500">
                <th className="px-4 py-2 text-left w-[26%]">Tiêu đề</th>
                <th className="px-2 py-2 text-left w-[10%]">Ưu tiên</th>
                <th className="px-2 py-2 text-left w-[14%]">Trạng thái</th>
                <th className="px-2 py-2 text-left w-[16%]">Tiến độ</th>
                <th className="px-2 py-2 text-left w-[14%]">Deadline</th>
                <th className="px-2 py-2 text-left w-[14%]">Nhân viên</th>
                <th className="px-4 py-2 text-right w-[8%]">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    <Loader2 size={16} className="animate-spin inline-block mr-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              )}

              {!loading && filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Chưa có công việc nào.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredTasks.map((t) => {
                 // ================= LOGIC STATUS = DONE ===================
                const deadlineIso = t.deadline?.slice(0, 10);
                const warningBoundary = addDaysIso(todayIso, 2);

                // ĐÚNG LOGIC 100%: done = không cảnh báo
                let isOverdue = false;
                let isWarning = false;

                if (t.status !== "done" && deadlineIso) {
                  if (deadlineIso < todayIso) {
                    isOverdue = true;
                  } else if (deadlineIso <= warningBoundary) {
                    isWarning = true;
                  }
                }

                // hiển thị progress
                const displayProgress =
                  t.status === "done" ? 100 : clampProgress(t.progress);

                  return (
                    <tr
                      key={t.id}
                      className="border-t border-slate-100 hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-slate-800">
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {t.description}
                          </div>
                        )}
                      </td>

                      <td className="px-2 py-3 align-top">
                        {renderPriorityTag(t.priority)}
                      </td>

                      <td className="px-2 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          {renderStatusTag(t.status)}

                          {isWarning && !isOverdue && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-500">
                          <AlertTriangle size={11} />
                          Sắp trễ hạn
                        </span>
                      )}

                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-500">
                          <AlertTriangle size={11} />
                          Trễ hạn
                        </span>
                      )}
                        </div>
                      </td>

                      <td className="px-2 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>{displayProgress}%</span>
                            {t.status === "done" && (
                              <CheckCircle2
                                size={12}
                                className="text-emerald-500"
                              />
                            )}
                          </div>

                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                displayProgress >= 100
                                  ? "bg-emerald-500"
                                  : displayProgress >= 70
                                  ? "bg-blue-500"
                                  : "bg-amber-400"
                              }`}
                              style={{ width: `${displayProgress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-2 py-3 align-top text-xs text-slate-600">
                        {formatDate(t.deadline)}
                      </td>

                      <td className="px-2 py-3 align-top text-xs text-slate-600">
                        <div className="inline-flex items-center gap-1">
                          <User size={12} className="text-slate-400" />
                          <span>{t.assigned_to_name || "—"}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="flex justify-end gap-2">
                          {role === "admin" && (
                            <button
                              onClick={() => navigate(`/admin/tasks/${t.id}`)}
                              className="px-2 py-1 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                              Chi tiết
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(t)}
                            className="px-2 py-1 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"
                          >
                            <Edit3 size={12} />
                            Sửa
                          </button>

                          <button
                            onClick={() => handleDeleteTask(t)}
                            className="px-2 py-1 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {(openCreate || (openEdit && currentTask)) && (
        <TaskModal
          title={openCreate ? "Thêm công việc" : "Cập nhật công việc"}
          mode={openCreate ? "create" : "edit"}
          form={form}
          setForm={setForm}
          role={role}
          loading={creating || editing}
          onClose={closeModals}
          onSubmit={openCreate ? handleCreateTask : handleUpdateTask}
          employees={employees}
          uploadFile={uploadFile}
          setUploadFile={setUploadFile}
          currentTask={currentTask}
        />
      )}
    </div>
  );
}

// ===================================================================
// SUMMARY CARD
// ===================================================================
function SummaryCard({
  title,
  value,
  icon,
  variant = "default",
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: "default" | "warning" | "danger";
}) {
  const base =
    "rounded-2xl border shadow-sm px-4 py-3 flex items-center justify-between";

  const variantClass =
    variant === "danger"
      ? "bg-red-50 border-red-200"
      : variant === "warning"
      ? "bg-amber-50 border-amber-200"
      : "bg-white border-slate-200";

  return (
    <div className={`${base} ${variantClass}`}>
      <div>
        <p className="text-xs text-slate-500">{title}</p>
        <p className="mt-1 text-xl font-semibold text-slate-800">{value}</p>
      </div>
      <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

// ===================================================================
// MODAL
// ===================================================================
type TaskModalProps = {
  title: string;
  mode: "create" | "edit";
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  role: string;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
  employees: EmployeeItem[];
  uploadFile: File | null;
  setUploadFile: (f: File | null) => void;
  currentTask: Task | null;
};

function TaskModal({
  title,
  mode,
  form,
  setForm,
  role,
  loading,
  onClose,
  onSubmit,
  employees,
  uploadFile,
  setUploadFile,
  currentTask,
}: TaskModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <ListTodo className="text-blue-500" size={18} /> {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="space-y-3 text-sm">
          {/* TITLE */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, title: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="VD: Gọi điện chăm sóc khách hàng..."
            />
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Mô tả chi tiết
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, description: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 h-20"
              placeholder="Nội dung công việc cần thực hiện..."
            />
          </div>

          {/* PRIORITY + STATUS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Ưu tiên
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, priority: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="high">Ưu tiên cao</option>
                <option value="medium">Ưu tiên trung bình</option>
                <option value="low">Ưu tiên thấp</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Trạng thái
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, status: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="todo">Chưa làm</option>
                <option value="in_progress">Đang làm</option>
                <option value="done">Hoàn thành</option>
              </select>
            </div>
          </div>

          {/* PROGRESS + DEADLINE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Tiến độ (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) =>
                  setForm((f: any) => ({
                    ...f,
                    progress: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Deadline
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, deadline: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* ASSIGNED EMPLOYEE (ADMIN) */}
          {role === "admin" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Nhân viên được giao
              </label>
              <select
                value={form.assigned_to_id}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, assigned_to_id: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="">-- Chọn nhân viên --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.id} — {emp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* FILE ATTACHMENTS */}
          <div className="pt-3 border-t space-y-2">
            <label className="text-xs font-medium text-slate-600">
              File đính kèm
            </label>

            {form.attachments?.length > 0 ? (
              <ul className="space-y-1">
                {form.attachments.map((file: any) => (
                  <li
                    key={file.id}
                    className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border"
                  >
                    <span className="text-sm">📄 {file.file_name}</span>
                    <a
                      href={`${API}${file.file_path}`}
                      download
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Tải xuống
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">Chưa có file.</p>
            )}

            {/* UPLOAD (EMPLOYEE) */}
            {role === "employee" && currentTask && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Tải file báo cáo
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    setUploadFile(e.target.files?.[0] || null)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />

                <button
                  onClick={async () => {
                    if (!uploadFile) return alert("Vui lòng chọn file");

                    const fd = new FormData();
                    fd.append("file", uploadFile);

                    const res = await fetch(
                      `${API}/tasks/${currentTask.id}/upload`,
                      { method: "POST", body: fd }
                    );

                    if (!res.ok) {
                      alert("Lỗi tải file");
                      return;
                    }

                    const uploaded = await res.json();

                    setForm((f: any) => ({
                      ...f,
                      attachments: [...(f.attachments || []), uploaded],
                    }));

                    alert("Tải file thành công!");
                  }}
                  className="mt-2 px-3 py-2 rounded-xl bg-slate-100 border text-sm hover:bg-slate-200"
                >
                  Tải file
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 inline-flex items-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === "create" ? "Tạo công việc" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
