import { useEffect, useState } from "react";
import Table from "../../components/Table";

type ContractItem = {
  id: number;
  employee_name: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  basic_salary: number;
  status: string;
  note: string | null;
};

export default function ManageContracts() {
  const [rows, setRows] = useState<ContractItem[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/employee-management/contracts")
      .then((res) => res.json())
      .then((data) => setRows(data))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const columns = [
    "Nhân viên",
    "Loại hợp đồng",
    "Bắt đầu",
    "Kết thúc",
    "Trạng thái",
    "Lương cơ bản",
    "Ghi chú",
  ];

  const data = rows.map((r) => ({
    employee_name: r.employee_name,
    contract_type: r.contract_type,
    start_date: r.start_date,
    end_date: r.end_date,
    status: r.status,
    basic_salary: r.basic_salary?.toLocaleString(),
    note: r.note || "",
  }));

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Quản lý hợp đồng</h1>
      <Table columns={columns} data={data} />
    </div>
  );
}
