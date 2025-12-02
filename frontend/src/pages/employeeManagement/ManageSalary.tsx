import { useEffect, useState } from "react";
import Table from "../../components/Table";

export default function ManageSalary() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // =============================
  // 🔥 LOAD DATA TỪ BACKEND
  // =============================
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/salary/all?year=${year}&month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi khi load bảng lương:", err);
        setLoading(false);
      });
  }, []);

  // =============================
  // TABLE HEADER
  // =============================
  const columns = [
    "Nhân viên",
    "Tháng",
    "Lương cơ bản",
    "Ngày công",
    "Đi muộn",
    "Về sớm",
    "Tiền phạt",
    "Lương thực lãnh",
  ];

  // =============================
  // FORMAT DỮ LIỆU CHO TABLE
  // =============================
  const data = rows.map((r) => ({
    employee: r.employee_name,
    month: r.month,
    base_salary: r.base_salary.toLocaleString() + " VND",
    total_days: r.total_days,
    late: r.late,
    early: r.early,
    penalty: r.penalty.toLocaleString() + " VND",
    final_salary: r.final_salary.toLocaleString() + " VND",
  }));

  return (
    <div className="p-8 w-full">
      {/* TITLE */}
      <h1 className="text-2xl font-semibold mb-6">Quản lý tiền lương</h1>

      {/* CARD WRAPPER */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        {loading ? (
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        ) : (
          <Table columns={columns} data={data} />
        )}
      </div>
    </div>
  );
}
