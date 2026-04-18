import { z } from 'zod';

// Utility regex to prevent XSS in text inputs
const noXSSRegex = /^[^<>]*$/;

// ========== Authentication Validation Schemas ==========

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

// Password validation schema
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password must be less than 100 characters');

// Login form validation
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Signup form validation
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

// Clinic owner signup validation
export const clinicOwnerSignupSchema = signupSchema.extend({
  clinicName: z
    .string()
    .min(1, 'Clinic name is required')
    .max(200, 'Clinic name must be less than 200 characters')
    .regex(noXSSRegex, 'Clinic name cannot contain < or > characters'),
  clinicAddress: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .regex(noXSSRegex, 'Address cannot contain < or > characters')
    .optional()
    .or(z.literal('')),
  clinicPhone: z
    .string()
    .max(20, 'Phone must be less than 20 characters')
    .optional()
    .or(z.literal('')),
});

export type ClinicOwnerSignupFormData = z.infer<typeof clinicOwnerSignupSchema>;

// Appointment validation schema
export const appointmentSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  petName: z.string().min(1, 'Pet name is required').max(100, 'Pet name must be less than 100 characters'),
  petType: z.enum(['Dog', 'Cat', 'Bird', 'Cattle'], { required_error: 'Pet type is required' }),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

// Checkout/Order validation schema
export const checkoutSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name must be less than 100 characters'),
  phone: z.string().min(1, 'Phone number is required').max(20, 'Phone number must be less than 20 characters'),
  address: z.string().min(1, 'Address is required').max(500, 'Address must be less than 500 characters'),
  division: z.string().min(1, 'Division is required').max(50, 'Division must be less than 50 characters'),
  district: z.string().min(1, 'District is required').max(50, 'District must be less than 50 characters'),
  thana: z.string().min(1, 'Thana is required').max(50, 'Thana must be less than 50 characters'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Profile validation schema
export const profileSchema = z.object({
  full_name: z.string().max(100, 'Full name must be less than 100 characters').regex(noXSSRegex, 'Name cannot contain < or > characters').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone number must be less than 20 characters').optional().or(z.literal('')),
  address: z.string().max(500, 'Address must be less than 500 characters').regex(noXSSRegex, 'Address cannot contain < or > characters').optional().or(z.literal('')),
  division: z.string().max(50, 'Division must be less than 50 characters').optional().or(z.literal('')),
  district: z.string().max(50, 'District must be less than 50 characters').optional().or(z.literal('')),
  thana: z.string().max(50, 'Thana must be less than 50 characters').optional().or(z.literal('')),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Review validation schema
export const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().max(1000, 'Comment must be less than 1000 characters').optional(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

// ========== Social Feature Validation Schemas ==========

// Comment validation schema - prevents XSS and enforces length limits
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be less than 2000 characters')
    .regex(noXSSRegex, 'Comment cannot contain < or > characters'),
});

export type CommentFormData = z.infer<typeof commentSchema>;

// Post validation schema
export const postSchema = z.object({
  content: z
    .string()
    .max(5000, 'Post content must be less than 5000 characters')
    .regex(noXSSRegex, 'Post content cannot contain < or > characters')
    .optional()
    .nullable(),
  media_urls: z.array(z.string().url()).max(10, 'Maximum 10 media files').optional(),
});

export type PostFormData = z.infer<typeof postSchema>;

// ========== Contact Form Validation Schema ==========

export const contactSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(noXSSRegex, 'Name cannot contain < or > characters'),
  email: emailSchema,
  subject: z
    .string()
    .max(200, 'Subject must be less than 200 characters')
    .regex(noXSSRegex, 'Subject cannot contain < or > characters')
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message must be less than 2000 characters')
    .regex(noXSSRegex, 'Message cannot contain < or > characters'),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// ========== Doctor Form Validation Schema ==========

export const doctorFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(noXSSRegex, 'Name cannot contain < or > characters'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(20, 'Phone must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  specialization: z.string().max(100, 'Specialization must be less than 100 characters').regex(noXSSRegex, 'Specialization cannot contain < or > characters').optional().or(z.literal('')),
  license_number: z.string().max(50).regex(noXSSRegex, 'License number cannot contain < or > characters').optional().or(z.literal('')),
  experience_years: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || (Number(val) >= 0 && Number(val) <= 60),
      'Experience must be between 0 and 60 years'
    ),
  consultation_fee: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || (Number(val) >= 0 && Number(val) <= 100000),
      'Fee must be between 0 and 100,000'
    ),
  bio: z.string().max(2000, 'Bio must be less than 2000 characters').regex(noXSSRegex, 'Bio cannot contain < or > characters').optional().or(z.literal('')),
  qualifications: z.array(z.string()).optional(),
  avatar_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

export type DoctorFormSchemaData = z.infer<typeof doctorFormSchema>;

// ========== Admin Product Validation Schema ==========

// Product form validation schema for admin UI (mirrors csvParser schema)
export const productFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters')
    .regex(noXSSRegex, 'Name cannot contain < or > characters'),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .regex(noXSSRegex, 'Description cannot contain < or > characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  price: z
    .number()
    .positive('Price must be positive')
    .max(9999999, 'Price must be less than 10,000,000'),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters'),
  product_type: z
    .string()
    .max(100, 'Product type must be less than 100 characters')
    .regex(noXSSRegex, 'Product type cannot contain < or > characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  image_url: z.string().optional().nullable().or(z.literal('')),
  stock: z
    .number()
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(999999, 'Stock must be less than 1,000,000'),
  badge: z
    .string()
    .max(50, 'Badge must be less than 50 characters')
    .regex(noXSSRegex, 'Badge cannot contain < or > characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  discount: z
    .number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%')
    .optional()
    .nullable(),
  is_active: z.boolean().optional().default(true),
  is_featured: z.boolean().optional().default(false),
  compare_price: z
    .number()
    .min(0, 'Compare price cannot be negative')
    .max(9999999, 'Compare price must be less than 10,000,000')
    .optional()
    .nullable(),
  sku: z
    .string()
    .max(50, 'SKU must be less than 50 characters')
    .regex(noXSSRegex, 'SKU cannot contain < or > characters')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

// ========== Clinic Service Validation Schema ==========

export const serviceFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Service name must be at least 2 characters')
    .max(150, 'Service name must be less than 150 characters')
    .regex(noXSSRegex, 'Name cannot contain < or > characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .regex(noXSSRegex, 'Description cannot contain < or > characters')
    .optional()
    .or(z.literal('')),
  price: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || (Number(val) >= 0 && Number(val) <= 1000000),
      'Price must be between 0 and 1,000,000'
    ),
  duration_minutes: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || (Number(val) >= 1 && Number(val) <= 480),
      'Duration must be between 1 and 480 minutes'
    ),
  is_active: z.boolean().default(true),
});

export type ServiceFormData = z.infer<typeof serviceFormSchema>;

// ========== Clinic Verification Validation Schema ==========

export const clinicVerificationSchema = z.object({
  ownerName: z
    .string()
    .min(1, 'Owner name is required')
    .max(100, 'Owner name must be less than 100 characters')
    .regex(noXSSRegex, 'Name cannot contain < or > characters'),
  ownerNid: z
    .string()
    .min(1, 'NID number is required')
    .max(20, 'NID must be less than 20 characters')
    .regex(/^[0-9]+$/, 'NID must contain only digits'),
  clinicName: z
    .string()
    .min(1, 'Clinic name is required')
    .max(200, 'Clinic name must be less than 200 characters')
    .regex(noXSSRegex, 'Clinic name cannot contain < or > characters'),
  clinicAddress: z
    .string()
    .min(1, 'Clinic address is required')
    .max(500, 'Address must be less than 500 characters')
    .regex(noXSSRegex, 'Address cannot contain < or > characters'),
  clinicPhone: z
    .string()
    .max(20, 'Phone must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  clinicEmail: z
    .string()
    .email('Please enter a valid email')
    .max(255)
    .optional()
    .or(z.literal('')),
  clinicDescription: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .regex(noXSSRegex, 'Description cannot contain < or > characters')
    .optional()
    .or(z.literal('')),
});

export type ClinicVerificationFormData = z.infer<typeof clinicVerificationSchema>;

// ========== Doctor Verification Validation Schema ==========

export const doctorVerificationSchema = z.object({
  name: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(noXSSRegex, 'Name cannot contain < or > characters'),
  nid_number: z
    .string()
    .min(1, 'NID number is required')
    .max(20, 'NID must be less than 20 characters')
    .regex(/^[0-9]+$/, 'NID must contain only digits'),
  license_number: z
    .string()
    .min(1, 'License number is required')
    .max(50, 'License number must be less than 50 characters')
    .regex(noXSSRegex, 'License number cannot contain < or > characters'),
  specialization: z.string().max(100).optional().or(z.literal('')),
  experience_years: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || (Number(val) >= 0 && Number(val) <= 60),
      'Experience must be between 0 and 60 years'
    ),
  bio: z.string().max(2000, 'Bio must be less than 2000 characters').optional().or(z.literal('')),
});

export type DoctorVerificationFormData = z.infer<typeof doctorVerificationSchema>;

// ========== Pet Form Validation Schema ==========

export const petFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Pet name is required')
    .max(50, 'Name must be less than 50 characters')
    .regex(noXSSRegex, 'Name cannot contain < or > characters'),
  species: z
    .string()
    .min(1, 'Species is required'),
  breed: z
    .string()
    .max(50, 'Breed must be less than 50 characters')
    .regex(noXSSRegex, 'Breed cannot contain < or > characters')
    .optional()
    .or(z.literal('')),
  age: z
    .string()
    .max(30, 'Age must be less than 30 characters')
    .regex(noXSSRegex, 'Age cannot contain < or > characters')
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .max(300, 'Bio must be less than 300 characters')
    .regex(noXSSRegex, 'Bio cannot contain < or > characters')
    .optional()
    .or(z.literal('')),
});

export type PetFormData = z.infer<typeof petFormSchema>;
