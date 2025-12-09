import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#3D7FFF", "#34D399", "#FCA5A5", "#FBBF24"];

export default function ChartPie({
  title = "",
  data,
}: {
  title?: string; // ⭐ FIX: cho phép optional
  data: { name: string; value: number }[];
}) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
      
      {/* Hiển thị title nếu có */}
      {title && (
        <h3 className="font-semibold mb-3 text-slate-700">{title}</h3>
      )}

      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={45}
            paddingAngle={3}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
                stroke="#fff"
                strokeWidth={2}
                className="cursor-pointer"
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              borderRadius: 10,
              borderColor: "#ddd",
              fontSize: 12,
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
