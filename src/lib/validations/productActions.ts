/**
 * Zod validation schemas for admin product action dialogs.
 * Used by quick-stock edits and other inline product mutations.
 */
import { z } from 'zod';

export const quickStockSchema = z.object({
  stock: z
    .number({ invalid_type_error: 'Stock must be a number' })
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(999999, 'Stock must be 999,999 or fewer'),
});

export type QuickStockInput = z.infer<typeof quickStockSchema>;
