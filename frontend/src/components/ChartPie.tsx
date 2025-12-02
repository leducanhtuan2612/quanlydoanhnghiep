import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

// 🎨 Bảng màu phân biệt rõ ràng
const COLORS = [
  "#3D7FFF", // Xanh đậm
  "#34D399", // Xanh mint
  "#FCA5A5", // Đỏ pastel
  "#FBBF24", // Vàng pastel
];

export default function ChartPie({ data }:{data:{name:string; value:number}[]}) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
      <h3 className="font-semibold mb-3 text-slate-700">Doanh số theo danh mục</h3>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={85}
            label={({ name, value }) => `${value}`}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
