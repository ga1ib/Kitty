import { z } from 'zod'

export const loginSchema = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(1, 'Enter your password') })
export const signupSchema = z.object({
  role: z.enum(['BUYER', 'SELLER']), firstName: z.string().trim().min(1, 'First name is required'), lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'), phone: z.string().trim().min(6, 'Enter a valid phone number'), password: z.string().min(10, 'Use at least 10 characters'), confirmPassword: z.string().min(1, 'Confirm your password'),
  address: z.string().optional(), city: z.string().optional(), postalCode: z.string().optional(), country: z.string().optional(),
  shopName: z.string().optional(), shopDescription: z.string().optional(), businessAddress: z.string().optional(),
}).superRefine((input, ctx) => {
  if (input.password !== input.confirmPassword) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Passwords do not match', path: ['confirmPassword'] })
  const requiredFields = input.role === 'BUYER' ? ['address', 'city', 'postalCode', 'country'] as const : ['shopName', 'businessAddress', 'city', 'postalCode'] as const
  for (const field of requiredFields) if (!input[field]?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'This field is required', path: [field] })
})

export type SignupValues = z.infer<typeof signupSchema>
