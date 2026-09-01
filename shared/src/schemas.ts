import { z } from 'zod';

const IndianMobileSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ''))
  .refine(
    (value) => /^(?:\+91|91)?[6-9]\d{9}$/.test(value),
    'Enter a valid 10-digit Indian mobile number'
  )
  .transform((value) => {
    const nationalNumber = value.startsWith('+91')
      ? value.slice(3)
      : value.length === 12 && value.startsWith('91')
        ? value.slice(2)
        : value;
    return `+91${nationalNumber}`;
  });

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: IndianMobileSchema.optional().nullable(),
  location: z.string().optional().nullable(),
  crops: z.string().optional().nullable(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: IndianMobileSchema.optional().nullable(),
  location: z.string().optional().nullable(),
  crops: z.string().optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export const VerifyRegisterOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const CompleteRegistrationSchema = z.object({
  registrationToken: z.string().min(1, 'Registration token is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: IndianMobileSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  location: z.string().min(2, 'Location is required'),
  crops: z.string().optional().nullable(),
});

export const ResendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  purpose: z.enum(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET']).optional(),
});

export const LoginOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const VerifyLoginOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: IndianMobileSchema.optional().nullable(),
  location: z.string().optional().nullable(),
  crops: z.string().optional().nullable(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const VerifyResetOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const ResetPasswordSchema = z
  .object({
    resetToken: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters').optional(),
  })
  .refine((data) => !data.confirmPassword || data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const ResendResetOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// ============================================================================
// ADMIN & SYSTEM SCHEMAS
// ============================================================================

export const CustomerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const TestSmtpSchema = z.object({
  to: z.string().email('Invalid email address'),
});

// ============================================================================
// CATEGORY SCHEMAS
// ============================================================================

export const CreateCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  description: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

export const CreateProductSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be greater than 0'),
  discountPrice: z.number().positive('Discount price must be greater than 0').optional().nullable(),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  featured: z.boolean().default(false),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required'),
  attributes: z.record(z.any()).optional().nullable(),
  categoryId: z.string().uuid('Invalid category ID'),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'rating', 'popular']).default('newest'),
  featured: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
});

// ============================================================================
// CART SCHEMAS
// ============================================================================

export const AddToCartSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  selectedAttributes: z.record(z.any()).optional().nullable(),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export const SyncCartSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      selectedAttributes: z.record(z.any()).optional().nullable(),
    })
  ),
});

// ============================================================================
// SHIPPING ADDRESS & ORDER SCHEMAS
// ============================================================================

export const ShippingAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(4, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  phone: IndianMobileSchema,
});

export const CreateOrderSchema = z.object({
  shippingAddress: ShippingAddressSchema,
  paymentMethod: z.enum(['CREDIT_CARD', 'PAYPAL', 'STRIPE', 'CASH_ON_DELIVERY', 'RAZORPAY']),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ).optional(),
});

export const UpdateOrderStatusSchema = z.object({
  orderStatus: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
});

// ============================================================================
// PAYMENT SCHEMAS (RAZORPAY)
// ============================================================================

export const CreateRazorpayOrderSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
});

export const VerifyRazorpayPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  orderId: z.string().uuid('Invalid order ID'),
});

// ============================================================================
// REVIEW SCHEMAS
// ============================================================================

export const CreateReviewSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(5, 'Review comment must be at least 5 characters'),
});

// ============================================================================
// TYPE INFERENCES
// ============================================================================

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterOtpInput = z.infer<typeof RegisterOtpSchema>;
export type VerifyRegisterOtpInput = z.infer<typeof VerifyRegisterOtpSchema>;
export type CompleteRegistrationInput = z.infer<typeof CompleteRegistrationSchema>;
export type ResendOtpInput = z.infer<typeof ResendOtpSchema>;
export type LoginOtpInput = z.infer<typeof LoginOtpSchema>;
export type VerifyLoginOtpInput = z.infer<typeof VerifyLoginOtpSchema>;

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type VerifyResetOtpInput = z.infer<typeof VerifyResetOtpSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ResendResetOtpInput = z.infer<typeof ResendResetOtpSchema>;

export type CustomerQueryInput = z.infer<typeof CustomerQuerySchema>;
export type TestSmtpInput = z.infer<typeof TestSmtpSchema>;

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductQueryInput = z.infer<typeof ProductQuerySchema>;

export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type SyncCartInput = z.infer<typeof SyncCartSchema>;

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

export type CreateRazorpayOrderInput = z.infer<typeof CreateRazorpayOrderSchema>;
export type VerifyRazorpayPaymentInput = z.infer<typeof VerifyRazorpayPaymentSchema>;

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
