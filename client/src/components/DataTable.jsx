export default function DataTable({ columns, rows, empty = "No records yet." }) {
  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 font-medium whitespace-nowrap">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">{empty}</td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={r._id || i} className="border-t border-slate-100 hover:bg-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 whitespace-nowrap">
                    {c.render ? c.render(r) : r[c.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
