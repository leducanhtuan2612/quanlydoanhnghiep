type Order = { id:number; customer:string; date:string; status:"Hoàn thành"|"Đang xử lý"|"Đã hủy"|"Suất xưởng"; amount:number; };

const badge = (s:Order["status"]) => {
  const map:any = {
    "Hoàn thành":"bg-green-100 text-green-700",
    "Đang xử lý":"bg-blue-100 text-blue-700",
    "Đã hủy":"bg-red-100 text-red-700",
    "Suất xưởng":"bg-amber-100 text-amber-700",
  };
  return `px-2 py-1 rounded-full text-xs font-medium ${map[s]}`;
};

export default function TableOrders({ data }:{data:Order[]}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <h3 className="font-semibold mb-3">Đơn hàng gần đây</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-3 py-2">Mã đơn</th>
              <th className="text-left px-3 py-2">Khách hàng</th>
              <th className="text-left px-3 py-2">Ngày</th>
              <th className="text-left px-3 py-2">Trạng thái</th>
              <th className="text-right px-3 py-2">Số tiền</th>
            </tr>
          </thead>
          <tbody>
            {data.map((o)=>(
              <tr key={o.id} className="border-t">
                <td className="px-3 py-2 font-medium">{o.id}</td>
                <td className="px-3 py-2">{o.customer}</td>
                <td className="px-3 py-2">{o.date}</td>
                <td className="px-3 py-2"><span className={badge(o.status)}>{o.status}</span></td>
                <td className="px-3 py-2 text-right">₫{o.amount.toLocaleString("vi-VN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
