import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  email: z
    .string()
    .email('Please provide a valid email address')
    .trim()
    .toLowerCase(),
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject cannot exceed 200 characters')
    .trim(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message cannot exceed 2000 characters')
    .trim(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
