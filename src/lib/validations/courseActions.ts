/**
 * Zod validation schemas for course-batch admin mutations.
 * Centralises rules so CourseBatchesTable, useUpsertBatch, and any
 * future admin tooling apply identical constraints.
 */
import { z } from 'zod';

export const BATCH_STATUSES = ['open', 'filling', 'closed', 'completed'] as const;
export type BatchStatusInput = (typeof BATCH_STATUSES)[number];

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
  .or(z.literal(''))
  .nullable()
  .optional();

export const batchUpsertSchema = z
  .object({
    id: z.string().uuid().optional(),
    course_id: z.string().uuid('Invalid course id'),
    name: z
      .string()
      .trim()
      .min(1, 'Batch name is required')
      .max(80, 'Batch name must be 80 characters or fewer'),
    start_date: isoDate,
    end_date: isoDate,
    total_seats: z
      .number({ invalid_type_error: 'Seats must be a number' })
      .int('Seats must be a whole number')
      .min(1, 'At least 1 seat is required')
      .max(10000, 'Seats cannot exceed 10,000'),
    status: z.enum(BATCH_STATUSES),
  })
  .refine(
    (v) => {
      if (!v.start_date || !v.end_date) return true;
      return new Date(v.end_date) >= new Date(v.start_date);
    },
    { message: 'End date must be on or after start date', path: ['end_date'] },
  );

export type BatchUpsertInput = z.infer<typeof batchUpsertSchema>;
