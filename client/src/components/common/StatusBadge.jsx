const STATUS_STYLES = {
  // Order Statuses
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  placed:     'bg-blue-50 text-blue-700 border-blue-200',
  confirmed:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped:    'bg-blue-50 text-blue-800 border-blue-300',
  delivered:  'bg-green-50 text-green-700 border-green-200',
  cancelled:  'bg-red-50 text-red-700 border-red-200',

  // Store & Account Statuses
  approved:   'bg-green-50 text-green-700 border-green-200',
  rejected:   'bg-red-50 text-red-700 border-red-200',
  suspended:  'bg-gray-100 text-gray-700 border-gray-300',
  active:     'bg-green-50 text-green-700 border-green-200',
  deactivated:'bg-red-50 text-red-700 border-red-200',
  paid:       'bg-green-50 text-green-700 border-green-200',
  failed:     'bg-red-50 text-red-700 border-red-200',
};

const StatusBadge = ({ status = 'pending', className = '' }) => {
  const normalizedKey = (status || '').toString().toLowerCase();
  const badgeStyle = STATUS_STYLES[normalizedKey] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${badgeStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {status}
    </span>
  );
};

export default StatusBadge;
