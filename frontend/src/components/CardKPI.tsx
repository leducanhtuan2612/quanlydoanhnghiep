export default function CardKPI({
  title, value, change,
}: { title: string; value: string; change: string }) {
  const up = change.trim().startsWith("+");

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 hover:shadow-lg transition">
      <div className="text-sm text-slate-500 font-medium">{title}</div>

      <div className="text-3xl font-bold mt-2 text-slate-900">
        {value}
      </div>

      <div className={`text-sm mt-1 font-semibold flex items-center gap-1 ${up ? "text-green-600" : "text-red-500"}`}>
        {up ? "▲" : "▼"} {change.replace(/[+-]/, "")}
      </div>
    </div>
  );
}
