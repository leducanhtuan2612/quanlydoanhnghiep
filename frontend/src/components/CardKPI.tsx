export default function CardKPI({
  title, value, change,
}: { title: string; value: string; change: string }) {
  const up = change.trim().startsWith("+");
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      <div className={`text-sm mt-1 ${up ? "text-green-600" : "text-red-500"}`}>
        {up ? "▲ " : "▼ "}{change.replace(/[+-]/,'')}
      </div>
    </div>
  );
}
