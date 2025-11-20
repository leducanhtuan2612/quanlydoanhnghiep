import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

interface ChartLineProps {
  data: { name: string; value: number }[];
}

export default function ChartLine({ data }: ChartLineProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" stroke="#555" />
        <YAxis />
        <Tooltip />

        <Line
          type="monotone"
          dataKey="value"
          stroke="#7c3aed"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
