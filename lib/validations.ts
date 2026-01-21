import { z } from 'zod'

/**
 * Sanitize string input by trimming and removing dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

/**
 * Phone number validation - Nigerian format
 */
const phoneRegex = /^(\+234|234|0)?[789][01]\d{8}$/

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Member form validation schema
 */
export const memberSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .transform(sanitizeString),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Please enter a valid Nigerian phone number')
    .transform((val) => val.replace(/\s/g, '')),
  email: z
    .string()
    .email('Please enter a valid email')
    .max(255, 'Email is too long')
    .transform((val) => val.toLowerCase().trim())
    .nullable()
    .optional()
    .or(z.literal('')),
  whatsapp: z
    .string()
    .regex(phoneRegex, 'Please enter a valid WhatsApp number')
    .nullable()
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(500, 'Notes are too long')
    .transform(sanitizeString)
    .nullable()
    .optional()
    .or(z.literal('')),
  status: z.enum(['active', 'left']).default('active'),
})

export type MemberInput = z.infer<typeof memberSchema>

/**
 * Contribution form validation schema
 */
export const contributionSchema = z.object({
  member_id: z.string().uuid('Invalid member ID'),
  month_year: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  amount_paid: z
    .number()
    .min(0, 'Amount cannot be negative')
    .max(100000000, 'Amount is too large'),
  expected_amount: z
    .number()
    .min(0, 'Amount cannot be negative')
    .max(100000000, 'Amount is too large'),
})

export type ContributionInput = z.infer<typeof contributionSchema>

/**
 * Payout form validation schema
 */
export const payoutSchema = z.object({
  member_id: z.string().uuid('Invalid member ID'),
  month_year: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  amount: z
    .number()
    .min(0, 'Amount cannot be negative')
    .max(100000000, 'Amount is too large'),
  note: z
    .string()
    .max(500, 'Note is too long')
    .transform(sanitizeString)
    .nullable()
    .optional()
    .or(z.literal('')),
})

export type PayoutInput = z.infer<typeof payoutSchema>

/**
 * Group settings validation schema
 */
export const settingsSchema = z.object({
  group_name: z
    .string()
    .min(1, 'Group name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .transform(sanitizeString),
  monthly_contribution: z
    .number()
    .min(100, 'Minimum contribution is ₦100')
    .max(10000000, 'Maximum contribution is ₦10,000,000'),
  cycle_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
})

export type SettingsInput = z.infer<typeof settingsSchema>

/**
 * Validate and parse form data with proper error handling
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors = result.error.errors.map((err) => {
    const path = err.path.join('.')
    return path ? `${path}: ${err.message}` : err.message
  })

  return { success: false, errors }
}
