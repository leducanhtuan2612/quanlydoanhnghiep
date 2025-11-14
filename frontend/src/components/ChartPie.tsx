import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
const COLORS = ["#2563EB","#16A34A","#F59E0B","#64748B"];

export default function ChartPie({ data }:{data:{name:string; value:number}[]}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <h3 className="font-semibold mb-2">Doanh số theo danh mục</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
