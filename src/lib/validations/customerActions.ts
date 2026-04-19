/**
 * Zod schemas for admin Customer & E-Commerce Customer mutations.
 * Caps payload size and constrains payment status to known enum values.
 */
import { z } from 'zod';

// UUID v4 / v5 / nil — defense-in-depth check before sending to Supabase
export const uuidSchema = z.string().uuid('Invalid user ID format');

export const paymentStatusSchema = z.enum(['paid', 'unpaid', 'refunded'], {
  errorMap: () => ({ message: 'Payment status must be paid, unpaid, or refunded' }),
});

export const bulkPaymentUpdateSchema = z.object({
  userIds: z.array(uuidSchema).min(1, 'Select at least one customer').max(500, 'Cannot update more than 500 at once'),
  status: paymentStatusSchema,
});

export type BulkPaymentUpdateInput = z.infer<typeof bulkPaymentUpdateSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
