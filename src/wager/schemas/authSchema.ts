import { z } from 'zod'
import { subYears } from 'date-fns'

export const signUpSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be 20 characters or less')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  display_name: z.string().min(1, 'Enter your name').max(50, 'Name too long'),
  date_of_birth: z
    .string()
    .min(1, 'Enter your date of birth')
    .refine((val) => {
      const dob = new Date(val)
      return !isNaN(dob.getTime()) && dob <= subYears(new Date(), 18)
    }, 'You must be 18 or older to use 1v1 Club'),
  age_confirmed: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm you are 18 or older' }),
  }),
})

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})

export type SignUpFormData = z.infer<typeof signUpSchema>
export type SignInFormData = z.infer<typeof signInSchema>
