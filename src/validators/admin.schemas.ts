import { z } from 'zod';

/**
 * Strict allow-list schemas for admin endpoints. Unknown keys are stripped, so fields
 * such as role, password, email or emailVerified can never be mass-assigned. Numeric
 * inputs accept numbers or numeric strings, matching what the admin forms send.
 */

const emptyToUndefined = (value: unknown) => (value === '' || value === null || value === undefined ? undefined : value);

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

const optionalNumber = (schema: z.ZodNumber) => z.preprocess(emptyToUndefined, schema.optional());

export const CustomerStatusSchema = z.enum(['Active', 'Deactivated', 'Verified', 'Pending']);

export const AdminCreateCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().email('Invalid email address').max(255),
  phone: optionalText(30),
  location: optionalText(200),
  crops: optionalText(200),
  status: CustomerStatusSchema.optional(),
});

export const AdminUpdateCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: optionalText(30),
  location: optionalText(200),
  crops: optionalText(200),
  status: CustomerStatusSchema.optional(),
});

export const InventoryUpdateSchema = z.object({
  stock: z.coerce.number().int('Stock must be a whole number').min(0, 'Stock quantity cannot be negative').max(10_000_000),
});

export const CreateCouponSchema = z
  .object({
    code: z.string().trim().min(2, 'Coupon code must be at least 2 characters').max(40, 'Coupon code is too long'),
    discountType: z.enum(['PERCENTAGE', 'FIXED']),
    discountValue: z.coerce.number().positive('Enter a valid discount value'),
    minimumSpend: optionalNumber(z.number().min(0)),
    usageLimit: optionalNumber(z.number().int().min(0)),
    validUntil: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Invalid expiry date')
        .optional()
    ),
    showOnHomepage: z.boolean().optional(),
  })
  .refine((data) => data.discountType !== 'PERCENTAGE' || data.discountValue <= 100, {
    message: 'Percentage discount cannot exceed 100',
    path: ['discountValue'],
  });

export const UpdateCouponSchema = z.object({
  active: z.boolean().optional(),
  showOnHomepage: z.boolean().optional(),
});

export const StoreSettingsSchema = z.object({
  standardShippingFee: z.coerce.number().min(0).max(1_000_000),
  freeShippingThreshold: z.coerce.number().min(0).max(100_000_000),
  shippingPolicyEffectiveDate: z.string().max(40).optional().nullable(),
  returnPolicyEffectiveDate: z.string().max(40).optional().nullable(),
});

export const CreateExpertSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  specialization: z.string().trim().min(1, 'Specialization is required').max(200),
  territory: z.string().trim().min(1, 'Territory is required').max(200),
  avatar: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => /^https?:\/\//i.test(value) || value.startsWith('/uploads/'), 'Invalid avatar URL')
    .optional(),
  phone: z.string().trim().max(30).optional(),
});
