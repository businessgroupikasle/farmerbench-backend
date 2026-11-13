import { z } from 'zod';

/**
 * Strict allow-list schemas for admin endpoints. Unknown keys are stripped, so fields
 * such as role, password, email or emailVerified can never be mass-assigned. Numeric
 * inputs accept numbers or numeric strings, matching what the admin forms send.
 */

const emptyToUndefined = (value: unknown) => (value === '' || value === null || value === undefined ? undefined : value);

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
const mobileNumber = z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

const optionalNumber = (schema: z.ZodNumber) => z.preprocess(emptyToUndefined, schema.optional());

export const CustomerStatusSchema = z.enum(['Active', 'Deactivated', 'Verified', 'Pending']);

export const AdminCreateCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().email('Invalid email address').max(255),
  phone: mobileNumber,
  location: optionalText(200),
  crops: optionalText(200),
  status: CustomerStatusSchema.optional(),
});

export const AdminUpdateCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string().trim().regex(/^(?:\+91)?[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional(),
  location: optionalText(200),
  crops: optionalText(200),
  status: CustomerStatusSchema.optional(),
});

export const InventoryUpdateSchema = z.object({
  stock: z.coerce.number().int('Stock must be a whole number').min(0, 'Stock quantity cannot be negative').max(10_000_000),
});

export const CreateCouponSchema = z
  .object({
    code: z
      .string({ required_error: 'Coupon code is required' })
      .trim()
      .min(2, 'Coupon code must be at least 2 characters')
      .max(40, 'Coupon code is too long')
      .regex(/^[A-Z0-9]+$/, 'Coupon code must contain uppercase letters and numbers only (no spaces or special characters)'),
    discountType: z.enum(['PERCENTAGE', 'FIXED'], { required_error: 'Discount type is required' }),
    discountValue: z.coerce.number({ required_error: 'Discount value is required' }).positive('Discount value must be greater than 0'),
    minimumSpend: optionalNumber(z.number().min(0)),
    usageLimit: optionalNumber(z.number().int('Usage limit must be a whole number').positive('Usage limit must be a positive number')),
    validUntil: z
      .string({ required_error: 'Valid Until date is required' })
      .trim()
      .min(1, 'Valid Until date is required')
      .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Invalid expiry date')
      .refine((value) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const parsed = new Date(value);
        return parsed >= today;
      }, 'Valid Until date cannot be in the past'),
    showOnHomepage: z.boolean().optional(),
  })
  .refine((data) => data.discountType !== 'PERCENTAGE' || data.discountValue <= 100, {
    message: 'Percentage discount cannot exceed 100%',
    path: ['discountValue'],
  });

export const UpdateCouponSchema = z.object({
  active: z.boolean().optional(),
  showOnHomepage: z.boolean().optional(),
});

export const StoreSettingsSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().trim().max(1000).optional(),
  standardShippingFee: z.coerce.number().min(0).max(1_000_000),
  freeShippingThreshold: z.coerce.number().min(0).max(100_000_000),
  shippingPolicyEffectiveDate: z.string().max(40).optional().nullable(),
  returnPolicyEffectiveDate: z.string().max(40).optional().nullable(),
});

export const CreateExpertSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100)
    .regex(/\p{L}/u, 'Enter a valid name containing letters; degree abbreviations and punctuation are allowed'),
  specialization: z.string().trim().min(1, 'Specialization is required').max(200),
  territory: z.string().trim().min(1, 'Territory is required').max(200),
  avatar: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => /^https?:\/\//i.test(value) || value.startsWith('/uploads/'), 'Invalid avatar URL')
    .optional(),
  phone: mobileNumber,
});
