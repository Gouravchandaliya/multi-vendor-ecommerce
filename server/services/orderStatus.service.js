/**
 * Centralized Order Status State Machine & Transition Service.
 *
 * Lifecycle Sequence:
 *   placed → confirmed → processing → shipped → out_for_delivery → delivered
 *
 * Cancellation allowed only before shipment:
 *   placed | confirmed | processing → cancelled
 */

const ORDER_STATUS_FLOW = {
  placed:           ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['shipped', 'cancelled'],
  shipped:          ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered:        [],
  cancelled:        [],
};

/**
 * Validates if transitioning from currentStatus to targetStatus is allowed.
 */
const isValidStatusTransition = (currentStatus, targetStatus) => {
  if (!currentStatus || !targetStatus) return false;
  if (currentStatus === targetStatus) return true; // Idempotent no-op

  const allowedNext = ORDER_STATUS_FLOW[currentStatus];
  return allowedNext ? allowedNext.includes(targetStatus) : false;
};

/**
 * Returns allowed next statuses for UI action buttons.
 */
const getNextValidStatuses = (currentStatus) => {
  return ORDER_STATUS_FLOW[currentStatus] || [];
};

/**
 * Derives the overall buyer-facing order status from individual item fulfillment statuses.
 */
const deriveOverallOrderStatus = (items = []) => {
  if (!items || items.length === 0) return 'placed';

  const statuses = items.map((i) => i.status);

  // If all items delivered -> delivered
  if (statuses.every((s) => s === 'delivered')) return 'delivered';

  // If all items cancelled -> cancelled
  if (statuses.every((s) => s === 'cancelled')) return 'cancelled';

  // Active status precedence
  if (statuses.some((s) => s === 'out_for_delivery')) return 'out_for_delivery';
  if (statuses.some((s) => s === 'shipped')) return 'shipped';
  if (statuses.some((s) => s === 'processing')) return 'processing';
  if (statuses.some((s) => s === 'confirmed')) return 'confirmed';

  return 'placed';
};

module.exports = {
  ORDER_STATUS_FLOW,
  isValidStatusTransition,
  getNextValidStatuses,
  deriveOverallOrderStatus,
};
