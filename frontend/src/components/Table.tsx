export default function Table({
  columns,
  data,
}: {
  columns: string[];
  data: Record<string, any>[];
}) {
  return (
    <div className="w-full overflow-hidden rounded-xl shadow-md border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          
          {/* HEADER */}
          <thead>
            <tr className="bg-gray-50 text-gray-700">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="border-b px-5 py-3 text-left font-semibold tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-6 text-gray-500"
                >
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-blue-50 transition-colors duration-150"
                >
                  {Object.values(row as Record<string, any>).map(
                    (cell: any, cidx: number) => (
                      <td key={cidx} className="border-b px-5 py-3 whitespace-nowrap">
                        {cell}
                      </td>
                    )
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
