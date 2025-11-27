"use client"

interface BreakdownTableProps {
  title?: string
  description?: string
  columns?: Array<{ key: string; label: string }>
  rows: Array<Record<string, any>>
}

export function BreakdownTable({ title, description, columns, rows }: BreakdownTableProps) {
  // Auto-generate columns from first row if not provided
  const tableColumns = columns || (rows.length > 0 ? Object.keys(rows[0]).map(key => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1) })) : [])

  return (
    <div className="bg-[#13152A]/60 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden">
      {(title || description) && (
        <div className="px-6 py-4 border-b border-white/10">
          {title && <h3 className="text-lg font-semibold text-[#E6E8FF]">{title}</h3>}
          {description && <p className="text-sm text-[#8A8FB2] mt-1">{description}</p>}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              {tableColumns.map((col) => (
                <th key={col.key} className="px-6 py-3 text-left text-sm font-medium text-[#8A8FB2]">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                {tableColumns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-[#E6E8FF]">
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
