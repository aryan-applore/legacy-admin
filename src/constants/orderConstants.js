export const ORDER_STATUS = Object.freeze({
  PLACED: 'placed',
  PROCESSED: 'processed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered'
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue'
});

export const ORDER_STATUS_OPTIONS = [
  { value: ORDER_STATUS.PLACED, label: 'Placed' },
  { value: ORDER_STATUS.PROCESSED, label: 'Processed' },
  { value: ORDER_STATUS.SHIPPED, label: 'Shipped' },
  { value: ORDER_STATUS.DELIVERED, label: 'Delivered' }
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: PAYMENT_STATUS.PENDING, label: 'Pending' },
  { value: PAYMENT_STATUS.PARTIAL, label: 'Partial' },
  { value: PAYMENT_STATUS.PAID, label: 'Paid' },
  { value: PAYMENT_STATUS.OVERDUE, label: 'Overdue' }
];
