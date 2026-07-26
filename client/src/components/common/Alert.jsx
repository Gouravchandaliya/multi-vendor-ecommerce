/**
 * Alert banner for success / error messages.
 * type: 'success' | 'error' | 'warning' | 'info'
 */
const styles = {
  success: 'bg-green-50 border-green-200 text-green-700',
  error:   'bg-red-50   border-red-200   text-red-700',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  info:    'bg-blue-50  border-blue-200  text-blue-700',
};

const Alert = ({ type = 'info', message, onClose }) => {
  if (!message) return null;
  return (
    <div role="alert" className={`flex items-start justify-between gap-3 p-3 rounded-lg border text-sm ${styles[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="shrink-0 font-bold opacity-60 hover:opacity-100 leading-none"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Alert;
