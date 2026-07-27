import { Link } from 'react-router';

const EmptyState = ({
  icon = '📦',
  title = 'No items found',
  message = 'There are no records to display at this time.',
  actionLabel = null,
  actionTo = null,
  onAction = null,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center space-y-4 shadow-sm max-w-md mx-auto my-6">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-3xl mx-auto shadow-sm">
        {icon}
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">{message}</p>
      </div>

      {actionLabel && actionTo && (
        <div className="pt-2">
          <Link
            to={actionTo}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            {actionLabel} &rarr;
          </Link>
        </div>
      )}

      {actionLabel && onAction && !actionTo && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
