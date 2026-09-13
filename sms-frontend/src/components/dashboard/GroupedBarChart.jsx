import React, { useEffect, useState } from "react";

export default function GroupedBarChart({
  title = "Goods Receipt Overview",
  categories = ["May 10", "May 17", "May 24", "May 31", "Jun 7"],
  series = [
    {
      name: "Received",
      color: "#93c5fd", // light blue
      data: [12, 18, 14, 16, 20],
    },
    {
      name: "Accepted",
      color: "#2563eb", // primary blue
      data: [10, 16, 12, 15, 19],
    },
  ],
  className = "",
}) {
  const allValues = series.flatMap((s) => s.data);
  const maxVal = Math.max(...allValues, 10);
  const chartHeight = 200;
  
  // Animation state
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`group flex flex-col justify-between rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">Weekly Flow</span>
      </div>

      <div className="relative w-full pb-2">
        {/* Bars Container */}
        <div
          className="flex items-end justify-between gap-4 border-b-2 border-slate-300 dark:border-slate-700 px-4 pb-2"
          style={{ height: `${chartHeight}px` }}
        >
          {categories.map((cat, catIdx) => {
            return (
              <div
                key={catIdx}
                className="flex flex-1 items-end justify-center gap-2 h-full"
              >
                {series.map((s, sIdx) => {
                  const val = s.data[catIdx] || 0;
                  const heightPercent = Math.max((val / maxVal) * 100, 6);
                  
                  return (
                    <div
                      key={sIdx}
                      className="relative w-4 sm:w-5 rounded-t-md shadow-sm"
                      style={{
                        height: animate ? `${heightPercent}%` : '0%',
                        backgroundColor: s.color,
                        transition: `height 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${catIdx * 100 + sIdx * 50}ms`,
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="mt-3 flex items-center justify-between px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {categories.map((cat, idx) => (
            <span 
              key={idx} 
              className="flex-1 text-center truncate"
              style={{
                opacity: animate ? 1 : 0,
                transform: animate ? 'translateY(0)' : 'translateY(10px)',
                transition: `opacity 0.5s ease-out ${800 + idx * 80}ms, transform 0.5s ease-out ${800 + idx * 80}ms`,
              }}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Bottom Legend with Values */}
        <div 
          className="mt-5 border-t-2 border-slate-200 dark:border-slate-800 pt-4"
          style={{
            opacity: animate ? 1 : 0,
            transition: 'opacity 0.6s ease-out 1200ms',
          }}
        >
          <div className="flex items-center justify-center gap-8 text-xs mb-4">
            {series.map((s, idx) => {
              // Calculate total for this series
              const total = s.data.reduce((sum, val) => sum + val, 0);
              return (
                <div key={idx} className="flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded shadow-sm"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="font-bold text-slate-900 dark:text-white">
                    {s.name}:
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {total} total
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Per-category breakdown */}
          <div className="grid grid-cols-5 gap-2 text-xs bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
            {categories.map((cat, catIdx) => (
              <div key={catIdx} className="text-center">
                <div className="font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {cat}
                </div>
                {series.map((s, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {s.data[catIdx] || 0}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
