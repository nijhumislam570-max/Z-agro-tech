/**
 * Zod validation schemas for admin order action dialogs.
 * Caps text lengths to prevent abuse and enforce data hygiene.
 */
import { z } from 'zod';

export const acceptOrderSchema = z.object({
  trackingId: z
    .string()
    .trim()
    .min(3, 'Tracking ID must be at least 3 characters')
    .max(64, 'Tracking ID must be 64 characters or fewer')
    .regex(/^[A-Za-z0-9-]+$/, 'Tracking ID may only contain letters, numbers, and dashes'),
  consignmentId: z
    .string()
    .trim()
    .max(64, 'Consignment ID must be 64 characters or fewer')
    .optional()
    .or(z.literal('')),
});

export const rejectOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Please provide a reason of at least 3 characters')
    .max(500, 'Rejection reason must be 500 characters or fewer'),
});

export type AcceptOrderInput = z.infer<typeof acceptOrderSchema>;
export type RejectOrderInput = z.infer<typeof rejectOrderSchema>;
