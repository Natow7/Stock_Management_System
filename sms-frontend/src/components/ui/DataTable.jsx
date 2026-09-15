import React, { useMemo, useState } from "react";
import { Search, Inbox } from "lucide-react";

export default function DataTable({
  columns,
  rows = [], // Default to empty array
  searchKeys = [],
  emptyLabel = "No records found.",
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    if (!q.trim()) return rows;
    const needle = q.toLowerCase();
    return rows.filter((r) =>
      searchKeys.some((k) =>
        String(r[k] ?? "")
          .toLowerCase()
          .includes(needle),
      ),
    );
  }, [rows, q, searchKeys]);

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
      {searchKeys.length > 0 && (
        <div className="flex items-center gap-3 border-b-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 py-3.5">
          <Search size={18} className="text-slate-500 dark:text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search records..."
            className="focus-ring w-full max-w-sm rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-university-500 dark:focus:border-university-600 transition-colors"
          />
          <span className="ml-auto text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            {filtered.length} of {rows?.length || 0}
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="whitespace-nowrap px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                      <Inbox size={28} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{emptyLabel}</p>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map((row, i) => (
              <tr
                key={row.id ?? i}
                className="border-b border-slate-200 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className="whitespace-nowrap px-5 py-3.5 text-sm font-medium text-slate-800 dark:text-slate-200"
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
