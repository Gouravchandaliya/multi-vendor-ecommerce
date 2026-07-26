/**
 * Displays a coloured pill for store/order status values.
 */
const colours = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved:  'bg-green-100  text-green-700  border-green-200',
  suspended: 'bg-red-100    text-red-700    border-red-200',
  active:    'bg-green-100  text-green-700  border-green-200',
  inactive:  'bg-gray-100   text-gray-600   border-gray-200',
};

const StatusBadge = ({ status }) => {
  const cls = colours[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${cls}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
