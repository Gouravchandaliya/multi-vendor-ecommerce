import React from 'react';

const OrderStatusDonut = ({ breakdown = [] }) => {
  const totalItems = breakdown.reduce((acc, b) => acc + b.count, 0);

  if (totalItems === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center text-xs text-gray-400 space-y-1">
        <span className="text-2xl block">📦</span>
        <p className="font-bold text-gray-700">No seller orders yet</p>
        <p>Order status distribution will display here once orders are placed.</p>
      </div>
    );
  }

  // Calculate SVG stroke dashes for donut segments
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  const segments = breakdown.map((item) => {
    const percent = item.count / totalItems;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += percent;

    return {
      ...item,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      
      {/* SVG Donut */}
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
          {segments.map((seg, idx) => (
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
              className="transition-all duration-500 hover:opacity-80 cursor-pointer"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-extrabold text-gray-900">{totalItems}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Items</span>
        </div>
      </div>

      {/* Legend List */}
      <div className="flex-1 space-y-2.5 w-full">
        {breakdown.map((item) => {
          const percent = totalItems > 0 ? Math.round((item.count / totalItems) * 100) : 0;
          return (
            <div key={item.status} className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-700">{item.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 font-extrabold">{item.count}</span>
                <span className="text-gray-400 text-[10px] w-8 text-right">{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default OrderStatusDonut;
