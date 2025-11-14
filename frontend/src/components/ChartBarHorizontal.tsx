import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function ChartBarHorizontal({ data }:{data:{name:string; value:number}[]}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <h3 className="font-semibold mb-2">Doanh thu theo khu vực</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={90} />
          <Tooltip />
          <Bar dataKey="value" fill="#2563EB" radius={[0,4,4,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
