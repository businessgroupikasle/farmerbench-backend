import { z } from 'zod';

// Auth Schemas
export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// Category Schemas
export const CreateCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

// Product Schemas
export const CreateProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be greater than 0'),
  discountPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  featured: z.boolean().default(false),
  images: z.array(z.string().url('Must be valid image URL')).min(1, 'At least one image is required'),
  categoryId: z.string().uuid('Invalid category ID'),
  attributes: z.record(z.any()).optional().nullable(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'rating', 'popular']).default('newest'),
  featured: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
});

// Cart Schemas
export const AddToCartSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  selectedAttributes: z.record(z.string()).optional().nullable(),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export const SyncCartSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      selectedAttributes: z.record(z.string()).optional().nullable(),
    })
  ),
});

// Shipping Address Schema
export const ShippingAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State / Province is required'),
  postalCode: z.string().min(3, 'Postal / ZIP code is required'),
  country: z.string().min(2, 'Country is required'),
  phone: z.string().min(7, 'Valid phone number is required'),
});

// Order Schemas
export const CreateOrderSchema = z.object({
  shippingAddress: ShippingAddressSchema,
  paymentMethod: z.enum(['CREDIT_CARD', 'PAYPAL', 'STRIPE', 'CASH_ON_DELIVERY']),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1, 'Order must contain at least one item').optional(),
});

export const UpdateOrderStatusSchema = z.object({
  orderStatus: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
});

// Review Schema
export const CreateReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(5, 'Comment must be at least 5 characters').max(1000),
});

// OTP Auth Schemas
export const RegisterOtpSchema = z.object({
  name: z.string().max(100).optional().default('Farmer User'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  crops: z.string().optional().nullable(),
  password: z.string().optional(),
});

export const VerifyRegisterOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
  name: z.string().optional(),
  password: z.string().optional(),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  crops: z.string().optional().nullable(),
});

export const ResendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  purpose: z.enum(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET']).default('REGISTRATION'),
});

export const LoginOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const VerifyLoginOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
});

// Payment Schemas (Razorpay)
export const CreateRazorpayOrderSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
});

export const VerifyRazorpayPaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  razorpayOrderId: z.string().min(1, 'Razorpay Order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay Payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay Signature is required'),
});

// Customer Management & Admin Schemas
export const CustomerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(['newest', 'name_asc', 'name_desc', 'orders_count']).default('newest'),
});

export const TestSmtpSchema = z.object({
  recipientEmail: z.string().email('Invalid recipient email address'),
});

// Type inferences
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductQueryInput = z.infer<typeof ProductQuerySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type SyncCartInput = z.infer<typeof SyncCartSchema>;
export type ShippingAddressInput = z.infer<typeof ShippingAddressSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type RegisterOtpInput = z.infer<typeof RegisterOtpSchema>;
export type VerifyRegisterOtpInput = z.infer<typeof VerifyRegisterOtpSchema>;
export type ResendOtpInput = z.infer<typeof ResendOtpSchema>;
export type LoginOtpInput = z.infer<typeof LoginOtpSchema>;
export type VerifyLoginOtpInput = z.infer<typeof VerifyLoginOtpSchema>;
export type CreateRazorpayOrderInput = z.infer<typeof CreateRazorpayOrderSchema>;
export type VerifyRazorpayPaymentInput = z.infer<typeof VerifyRazorpayPaymentSchema>;
export type CustomerQueryInput = z.infer<typeof CustomerQuerySchema>;
export type TestSmtpInput = z.infer<typeof TestSmtpSchema>;
