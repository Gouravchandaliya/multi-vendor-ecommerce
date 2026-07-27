import React, { useState } from 'react';

const RevenueChart = ({ trendData = [] }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!trendData || trendData.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-12 text-center text-xs text-gray-400 space-y-2">
        <span className="text-3xl block">📊</span>
        <p className="font-bold text-gray-700">No revenue data for this time period</p>
        <p>Sales revenue trends will automatically populate here once orders are paid.</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...trendData.map((d) => d.revenue), 10);
  const chartHeight = 180;
  const chartWidth = 500;
  const padding = 30;

  const points = trendData.map((d, index) => {
    const x = padding + (index / Math.max(1, trendData.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (d.revenue / maxRevenue) * (chartHeight - padding * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, point, i) => {
    return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
        <span>Highest Daily Revenue: <strong className="text-gray-900">${maxRevenue.toFixed(2)}</strong></span>
        <span>Total Data Points: <strong className="text-gray-900">{trendData.length} days</strong></span>
      </div>

      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48 overflow-visible">
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" />
          <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#f1f5f9" strokeWidth="1" />
          <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#e2e8f0" strokeWidth="1" />

          {/* Filled Area */}
          <path d={areaD} fill="url(#revenueGradient)" />

          {/* Trend Line */}
          <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoveredPoint?.date === p.date ? '6' : '4'}
              className="fill-blue-600 stroke-white stroke-2 cursor-pointer transition-all hover:scale-125"
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[11px] px-3 py-1.5 rounded-xl shadow-lg pointer-events-none z-10 flex gap-3 font-semibold">
            <span>📅 {hoveredPoint.date}</span>
            <span className="text-green-400">💵 ${hoveredPoint.revenue.toFixed(2)}</span>
            <span className="text-blue-300">📦 {hoveredPoint.orders} orders</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueChart;
