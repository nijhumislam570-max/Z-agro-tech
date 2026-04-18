import { z } from 'zod';

// Utility regex to prevent XSS in text inputs
const noXSSRegex = /^[^<>]*$/;

// ========== Authentication ==========

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .regex(noXSSRegex, 'Name cannot contain < or > characters'),
});
export type SignupFormData = z.infer<typeof signupSchema>;

// ========== Checkout / Profile ==========

export const checkoutSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  phone: z.string().min(1, 'Phone number is required').max(20),
  address: z.string().min(1, 'Address is required').max(500),
  division: z.string().min(1, 'Division is required').max(50),
  district: z.string().min(1, 'District is required').max(50),
  thana: z.string().min(1, 'Thana is required').max(50),
  notes: z.string().max(1000).optional(),
});
export type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const profileSchema = z.object({
  full_name: z.string().max(100).regex(noXSSRegex, 'Name cannot contain < or > characters').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(500).regex(noXSSRegex, 'Address cannot contain < or > characters').optional().or(z.literal('')),
  division: z.string().max(50).optional().or(z.literal('')),
  district: z.string().max(50).optional().or(z.literal('')),
  thana: z.string().max(50).optional().or(z.literal('')),
});
export type ProfileFormData = z.infer<typeof profileSchema>;

// ========== Reviews & Contact ==========

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export type ReviewFormData = z.infer<typeof reviewSchema>;

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).regex(noXSSRegex, 'Name cannot contain < or > characters'),
  email: emailSchema,
  subject: z.string().max(200).regex(noXSSRegex, 'Subject cannot contain < or > characters').optional().or(z.literal('')),
  message: z.string().min(1, 'Message is required').max(2000).regex(noXSSRegex, 'Message cannot contain < or > characters'),
});
export type ContactFormData = z.infer<typeof contactSchema>;

// ========== Admin Product ==========

export const productFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).regex(noXSSRegex, 'Name cannot contain < or > characters'),
  description: z.string().max(2000).regex(noXSSRegex, 'Description cannot contain < or > characters').optional().nullable().or(z.literal('')),
  price: z.number().positive('Price must be positive').max(9999999),
  category: z.string().min(1, 'Category is required').max(100),
  product_type: z.string().max(100).regex(noXSSRegex).optional().nullable().or(z.literal('')),
  image_url: z.string().optional().nullable().or(z.literal('')),
  stock: z.number().int().min(0).max(999999),
  badge: z.string().max(50).regex(noXSSRegex).optional().nullable().or(z.literal('')),
  discount: z.number().min(0).max(100).optional().nullable(),
  is_active: z.boolean().optional().default(true),
  is_featured: z.boolean().optional().default(false),
  compare_price: z.number().min(0).max(9999999).optional().nullable(),
  sku: z.string().max(50).regex(noXSSRegex).optional().nullable().or(z.literal('')),
});
export type ProductFormData = z.infer<typeof productFormSchema>;

// ========== Admin Course ==========

export const courseFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .regex(noXSSRegex, 'Title cannot contain < or > characters'),
  description: z
    .string()
    .max(4000, 'Description must be less than 4000 characters')
    .regex(noXSSRegex, 'Description cannot contain < or > characters')
    .optional()
    .or(z.literal('')),
  audience: z
    .string()
    .max(200, 'Audience must be less than 200 characters')
    .regex(noXSSRegex, 'Audience cannot contain < or > characters')
    .optional()
    .or(z.literal('')),
  price: z.coerce
    .number({ invalid_type_error: 'Price must be a number' })
    .min(0, 'Price cannot be negative')
    .max(9999999, 'Price too large'),
  thumbnail_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  video_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.enum([
    'plant_doctor',
    'plant_protection',
    'smart_farming',
    'urban_farming',
    'organic',
    'other',
  ]),
  mode: z.enum(['online', 'onsite', 'hybrid']),
  duration_label: z
    .string()
    .max(50, 'Duration label too long')
    .regex(noXSSRegex)
    .optional()
    .or(z.literal('')),
  curriculum: z.array(z.string().max(200)).max(50, 'Maximum 50 curriculum items'),
  whatsapp_number: z
    .string()
    .max(30, 'Phone number too long')
    .regex(/^[+\d\s-]*$/, 'Only digits, spaces, + and - allowed')
    .optional()
    .or(z.literal('')),
  whatsapp_message: z
    .string()
    .max(500, 'Message too long')
    .regex(noXSSRegex, 'Message cannot contain < or > characters')
    .optional()
    .or(z.literal('')),
  provides_certificate: z.boolean(),
  is_active: z.boolean(),
});
export type CourseFormData = z.infer<typeof courseFormSchema>;
