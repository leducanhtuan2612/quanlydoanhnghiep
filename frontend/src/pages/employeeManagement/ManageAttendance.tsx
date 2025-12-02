import { useEffect, useState } from "react";
import Table from "../../components/Table";

type AttendanceItem = {
  id: number;
  employee_name: string;
  date: string;
  check_in: string;
  check_out: string;
  status: string;
};

export default function ManageAttendance() {
  const [rows, setRows] = useState<AttendanceItem[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/employee-management/attendance")
      .then((res) => res.json())
      .then((data) => setRows(data))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  // Cột hiển thị
  const columns = ["Nhân viên", "Ngày", "Check in", "Check out", "Trạng thái"];

  // Map dữ liệu theo đúng thứ tự cột
  const data = rows.map((r) => ({
    employee_name: r.employee_name,
    date: r.date,
    check_in: r.check_in,
    check_out: r.check_out,
    status: r.status,
  }));

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">
        Chấm công toàn bộ nhân viên
      </h1>

      <Table columns={columns} data={data} />
    </div>
  );
}
