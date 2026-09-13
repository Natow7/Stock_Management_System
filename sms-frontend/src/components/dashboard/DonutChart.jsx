import React from "react";

export default function DonutChart({
  title = "Stock Summary",
  total = 1285,
  totalLabel = "Total Items",
  segments = [
    { label: "Available", count: 1028, percentage: 79, color: "#10b981" },
    { label: "Issued", count: 157, percentage: 12, color: "#3b82f6" },
    { label: "Reserved", count: 68, percentage: 5, color: "#f59e0b" },
    { label: "Low Stock", count: 32, percentage: 4, color: "#ef4444" },
  ],
  className = "",
}) {
  const size = 260;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate cumulative stroke dashes
  let cumulativePercentage = 0;
  const renderedSegments = segments.map((seg) => {
    const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
    cumulativePercentage += seg.percentage;
    return {
      ...seg,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div
      className={`group flex flex-col justify-between h-full rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">Live Data</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-12 flex-1 py-8">
        {/* SVG Donut Circle */}
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} className="-rotate-90 transform">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-700"
              strokeWidth={strokeWidth}
            />
            {/* Animated segments */}
            {renderedSegments.map((seg, idx) => (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                style={{
                  opacity: 0,
                  animation: `segmentAppear 0.8s ease-out ${idx * 150 + 300}ms forwards`
                }}
              />
            ))}
          </svg>

          {/* Central Counter with animation */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
            style={{ opacity: 0, animation: 'fadeIn 0.6s ease-out 1200ms forwards' }}
          >
            <span className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
              {typeof total === "number" ? total.toLocaleString() : total}
            </span>
            <span className="text-base font-semibold text-slate-500 dark:text-slate-400 mt-2">
              {totalLabel}
            </span>
          </div>
        </div>

        {/* Legend Breakdown with animation */}
        <div className="w-full max-w-[240px] space-y-5">
          {segments.map((seg, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-base text-slate-700 dark:text-slate-300"
              style={{
                opacity: 0,
                animation: `fadeIn 0.4s ease-out ${1800 + idx * 100}ms forwards`
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 shrink-0 rounded-full shadow-sm"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {seg.label}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900 dark:text-white">
                  {seg.count?.toLocaleString() ?? 0}
                </span>{" "}
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  ({seg.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes segmentAppear {
          from { 
            opacity: 0;
            stroke-dasharray: 0 ${circumference};
          }
          to { 
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
