/**
 * Z Agro Tech notification helpers.
 *
 * The legacy in-database `notifications` table (used by VET-MEDIX) has been
 * removed. We currently rely on toasts + email + Steadfast SMS for customer
 * communication. These helpers are kept as no-op shims so existing call sites
 * (admin order dialogs) compile and run without changes.
 *
 * If/when an in-app notification system is reintroduced, replace the bodies
 * here — the call sites do not need to change.
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
