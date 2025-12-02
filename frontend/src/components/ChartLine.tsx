import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area
} from "recharts";

export default function ChartLine({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <defs>
            <linearGradient id="lineShadow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(61,127,255,0.35)" />
              <stop offset="100%" stopColor="rgba(61,127,255,0)" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip />

          <Area
            type="monotone"
            dataKey="value"
            fill="url(#lineShadow)"
            stroke="#3D7FFF"
            strokeWidth={3}
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#3D7FFF"
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
