import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function ChartBarHorizontal({ data }:{data:{name:string; value:number}[]}) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
      <h3 className="font-semibold mb-3 text-slate-700">Doanh thu theo khu vực</h3>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical">
          <defs>
            <linearGradient id="barH" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3D7FFF" />
              <stop offset="100%" stopColor="#81B3FF" />
            </linearGradient>
          </defs>

          <XAxis type="number" stroke="#6b7280" />
          <YAxis type="category" dataKey="name" width={90} stroke="#6b7280" />

          <Tooltip />

          <Bar dataKey="value" fill="url(#barH)" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
