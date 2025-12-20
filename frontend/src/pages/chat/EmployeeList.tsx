interface Employee {
  id: number;
  name: string;
  position?: string;
}

export default function EmployeeList({
  employees,
  onSelect,
}: {
  employees: Employee[];
  onSelect: (e: Employee) => void;
}) {
  return (
    <div className="w-72 border-r bg-white">
      <div className="p-4 font-semibold border-b">
        💬 Trò chuyện nội bộ
      </div>

      {employees.map((e) => (
        <div
          key={e.id}
          onClick={() => onSelect(e)}
          className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
        >
          <div className="font-medium">{e.name}</div>
          <div className="text-xs text-gray-500">
            {e.position || "Nhân viên"}
          </div>
        </div>
      ))}
    </div>
  );
}
