import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function ChartBar({
  title = "",
  data,
}: {
  title?: string;   // ⭐ FIX: title không bắt buộc
  data: { name: string; value: number }[];
}) {
  return (
    <div className="w-full bg-white rounded-xl shadow-md border border-slate-200 p-4">
      
      {/* Hiển thị title nếu có */}
      {title && (
        <h3 className="font-semibold mb-3 text-slate-700">
          {title}
        </h3>
      )}

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3D7FFF" />
                <stop offset="100%" stopColor="#81B3FF" />
              </linearGradient>
            </defs>

            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />

            <Tooltip
              cursor={{ fill: "#f3f4f6" }}
              contentStyle={{
                borderRadius: 10,
                borderColor: "#ddd",
                fontSize: 12,
              }}
            />

            <Bar
              dataKey="value"
              fill="url(#blueGradient)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
