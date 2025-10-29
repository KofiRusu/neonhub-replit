"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], row: T) => ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
}

function compareValues(a: unknown, b: unknown) {
  if (a === b) return 0

  if (a === undefined || a === null) return 1
  if (b === undefined || b === null) return -1

  if (typeof a === "number" && typeof b === "number") {
    return a - b
  }

  const aValue = String(a).toLowerCase()
  const bValue = String(b).toLowerCase()

  if (aValue < bValue) return -1
  if (aValue > bValue) return 1
  return 0
}

export function DataTable<T>({ data, columns, onRowClick }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const tableData = useMemo(() => {
    if (!sortKey) return data

    return [...data].sort((rowA, rowB) => {
      const result = compareValues(rowA[sortKey], rowB[sortKey])
      return sortDir === "asc" ? result : -result
    })
  }, [data, sortDir, sortKey])

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir((direction) => (direction === "asc" ? "desc" : "asc"))
      return
    }

    setSortKey(key)
    setSortDir("asc")
  }

  return (
    <div className="glass p-4 rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((col) => {
              const isActive = sortKey === col.key
              return (
                <th
                  key={String(col.key)}
                  scope="col"
                  onClick={() => handleSort(col.key)}
                  className="text-left p-3 text-gray-400 font-medium select-none cursor-pointer"
                  aria-sort={isActive ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                >
                  <span className="inline-flex items-center space-x-1">
                    <span>{col.label}</span>
                    {isActive && <span className="text-xs">{sortDir === "asc" ? "▲" : "▼"}</span>}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="p-3 text-white">
                  {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
