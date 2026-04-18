/**
 * Z Agro Tech notification helpers.
 *
 * Order status changes are surfaced via toast + Steadfast SMS today. These
 * helpers are kept as no-op shims so existing call sites (admin order dialogs)
 * compile and run without changes. Replace bodies if an in-app notification
 * system is reintroduced — call sites do not need to change.
 */

import { logger } from '@/lib/logger';

interface CreateOrderNotificationParams {
  userId: string;
  orderId: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderTotal: number;
}

/** No-op: order status changes are surfaced via toast + Steadfast SMS. */
export const createOrderNotification = async (
  params: CreateOrderNotificationParams,
): Promise<void> => {
  if (import.meta.env.DEV) {
    logger.info('[notifications] createOrderNotification (no-op)', params);
  }
};

/** No-op: new-order alerts are surfaced via the admin dashboard + Steadfast. */
export const notifyAdminsOfNewOrder = async (
  params: { orderId: string; orderTotal: number; customerName?: string | null },
): Promise<void> => {
  if (import.meta.env.DEV) {
    logger.info('[notifications] notifyAdminsOfNewOrder (no-op)', params);
  }
};
