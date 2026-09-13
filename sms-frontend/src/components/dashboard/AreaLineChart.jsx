import React from "react";

export default function AreaLineChart({
  title = "System Activity",
  data = [35, 48, 42, 60, 52, 78, 65, 88, 72, 95],
  labels = ["May 10", "May 17", "May 24", "May 31", "Jun 7"],
  categories = null,
  series = null,
  color = "#8b5cf6",
  fillColor = "rgba(139, 92, 246, 0.12)",
  unit = "",
  className = "",
}) {
  const isMultiSeries = series && series.length > 0;
  const chartSeries = isMultiSeries ? series : [{ name: "Data", color, data }];
  const chartLabels = categories || labels;
  
  // ONLY FIX: Better scaling to spread lines across chart height
  const allValues = chartSeries.flatMap(s => s.data);
  const dataMax = Math.max(...allValues);
  const dataMin = Math.min(...allValues);
  
  // Calculate range and ensure minimum spread
  let range = dataMax - dataMin;
  if (range === 0) range = dataMax * 0.5 || 50;
  else if (range < dataMax * 0.2) range = dataMax * 0.4;
  
  const visualMin = Math.max(0, dataMin - range * 0.1);
  const visualMax = dataMax + range * 0.1;
  const visualRange = visualMax - visualMin;
  
  const width = 500;
  const height = 200;
  const paddingX = 40;
  const paddingY = 20;

  const generatePoints = (seriesData) => {
    return seriesData.map((val, i) => {
      const x = paddingX + (i / Math.max(seriesData.length - 1, 1)) * (width - paddingX * 2);
      const normalizedVal = visualRange > 0 ? (val - visualMin) / visualRange : 0.5;
      const y = paddingY + (1 - normalizedVal) * (height - paddingY * 2);
      return { x, y, val };
    });
  };

  const generatePath = (points) => {
    return points.reduce((acc, point, i, arr) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      const prev = arr[i - 1];
      const cp1x = prev.x + (point.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (point.x - prev.x) / 2;
      const cp2y = point.y;
      return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`;
    }, "");
  };

  const generateAreaPath = (pathD, points) => {
    return `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;
  };

  // Calculate total and trend for single series
  const singleSeriesTotal = !isMultiSeries ? data.reduce((a, b) => a + b, 0) : 0;
  const singleSeriesAvg = !isMultiSeries ? Math.round(singleSeriesTotal / data.length) : 0;
  const singleSeriesTrend = !isMultiSeries 
    ? ((data[data.length - 1] - data[0]) / data[0] * 100).toFixed(1)
    : 0;

  return (
    <div className={`group flex flex-col h-full rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
          Last 30 Days
        </span>
      </div>

      {/* Chart description */}
      {!isMultiSeries && (
        <div className="mb-3 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400">Avg:</span>
            <span className="font-bold text-slate-900 dark:text-white">{singleSeriesAvg}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400">Trend:</span>
            <span className={`font-bold ${parseFloat(singleSeriesTrend) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {parseFloat(singleSeriesTrend) >= 0 ? '↗' : '↘'} {Math.abs(parseFloat(singleSeriesTrend))}%
            </span>
          </div>
        </div>
      )}

      <div className="relative w-full flex-1 flex flex-col justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            {chartSeries.map((s, idx) => (
              <linearGradient key={idx} id={`grad-${title.replace(/\s+/g, "")}-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.05" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="1" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="1" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth="1.5" />

          {/* Vertical grid lines aligned with labels */}
          {chartSeries[0] && generatePoints(chartSeries[0].data).map((point, idx) => (
            <line
              key={idx}
              x1={point.x}
              y1={paddingY}
              x2={point.x}
              y2={height - paddingY}
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          ))}

          {chartSeries.map((s, idx) => {
            const points = generatePoints(s.data);
            const pathD = generatePath(points);
            const areaD = generateAreaPath(pathD, points);
            
            return (
              <g key={idx}>
                {/* SHADED AREA FILL BELOW THE LINE */}
                <path
                  d={areaD}
                  fill={`url(#grad-${title.replace(/\s+/g, "")}-${idx})`}
                  opacity="0"
                  style={{ animation: `fadeIn 0.6s ease-out ${idx * 100 + 200}ms forwards` }}
                />

                {/* SOLID LINE ON TOP - NORMAL WIDTH */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: '1000',
                    strokeDashoffset: '1000',
                    animation: `drawLine 2s ease-in-out ${idx * 200}ms forwards`
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* X-axis labels - correctly aligned with data points */}
        <div className="mt-3" style={{ position: 'relative', height: '20px', marginLeft: `${paddingX}px`, marginRight: `${paddingX}px` }}>
          {chartLabels.map((l, i) => {
            // Calculate the percentage position for each label
            const totalPoints = chartLabels.length - 1;
            const percentage = totalPoints > 0 ? (i / totalPoints) * 100 : 0;
            
            return (
              <span 
                key={i}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400"
                style={{ 
                  position: 'absolute',
                  left: `${percentage}%`,
                  transform: `translateX(-${percentage}%)`,
                  opacity: 0,
                  animation: `fadeIn 0.5s ease-out ${2000 + i * 80}ms forwards`,
                  whiteSpace: 'nowrap'
                }}
              >
                {l}
              </span>
            );
          })}
        </div>
      </div>

      {/* Multi-series legend */}
      {isMultiSeries && (
        <div className="mt-4 border-t-2 border-slate-200 dark:border-slate-800 pt-3">
          <div className="flex items-center justify-center gap-6 flex-wrap text-xs">
            {chartSeries.map((s, idx) => {
              const total = s.data.reduce((sum, val) => sum + val, 0);
              const avg = Math.round(total / s.data.length);
              return (
                <div 
                  key={idx} 
                  className="flex items-center gap-2"
                  style={{ opacity: 0, animation: `fadeIn 0.5s ease-out ${2400 + idx * 100}ms forwards` }}
                >
                  <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: s.color }} />
                  <span className="font-bold text-slate-900 dark:text-white">{s.name}:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Avg {avg}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
