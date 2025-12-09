import { useEffect, useState } from "react";
import Table from "../../components/Table";

type BenefitItem = {
  id: number;
  employee_name: string;
  title: string;
  start: string;
  end: string;
  status: string;
};

export default function ManageBenefits() {
  const [rows, setRows] = useState<BenefitItem[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/employee-management/benefits")
      .then((res) => res.json())
      .then((data) => {
        // 🔽 Sắp theo ngày bắt đầu (start) mới nhất → cũ nhất
        const sorted = data.sort((a: BenefitItem, b: BenefitItem) => {
          const dateA = new Date(a.start);
          const dateB = new Date(b.start);
          return dateB.getTime() - dateA.getTime();
        });

        setRows(sorted);
      })
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const columns = [
    "Nhân viên",
    "Tên chương trình",
    "Bắt đầu",
    "Kết thúc",
    "Trạng thái",
  ];

  const data = rows.map((r) => ({
    employee_name: r.employee_name,
    title: r.title,
    start: r.start,
    end: r.end,
    status: r.status,
  }));

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Quản lý phúc lợi</h1>
      <Table columns={columns} data={data} />
    </div>
  );
}
