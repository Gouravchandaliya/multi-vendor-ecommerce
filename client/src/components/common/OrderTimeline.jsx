const STEPS = [
  { key: 'placed',           label: 'Order Placed' },
  { key: 'confirmed',        label: 'Confirmed' },
  { key: 'processing',       label: 'Processing' },
  { key: 'shipped',          label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered',        label: 'Delivered' },
];

const OrderTimeline = ({ currentStatus = 'placed' }) => {
  if (currentStatus === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between text-red-700 text-xs font-bold">
        <div className="flex items-center gap-2">
          <span>❌</span>
          <span>Order Status: Cancelled</span>
        </div>
        <span className="text-[11px] text-red-500 font-normal">Fulfillment stopped</span>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between">
        
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0 rounded-full" />
        
        {/* Active Progress Line */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 z-0 rounded-full transition-all duration-500"
          style={{
            width: `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * 100}%`,
          }}
        />

        {/* Step Nodes */}
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent   = idx === currentIndex;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all duration-300 ${
                  isCompleted
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-200 animate-pulse'
                    : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? '✓' : idx + 1}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-semibold mt-2 text-center transition-colors ${
                  isCurrent
                    ? 'text-blue-600 font-extrabold'
                    : isCompleted
                    ? 'text-gray-900 font-bold'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}

      </div>
    </div>
  );
};

export default OrderTimeline;
