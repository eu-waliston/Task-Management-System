import { z } from 'zod';
import { UserRole } from '../../core/domain/User';

// Schema para criação de usuário
export const userCreateSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be at most 100 characters')
    .transform(email => email.toLowerCase().trim()),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    ),

  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'First name can only contain letters, spaces, hyphens and apostrophes'),

  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Last name can only contain letters, spaces, hyphens and apostrophes'),

  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: `Role must be one of: ${Object.values(UserRole).join(', ')}` })
  }),

  isActive: z.boolean().optional().default(true),
});

// Schema para atualização de usuário (todos os campos opcionais)
export const userUpdateSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be at most 100 characters')
    .transform(email => email.toLowerCase().trim())
    .optional(),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    )
    .optional(),

  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'First name can only contain letters, spaces, hyphens and apostrophes')
    .optional(),

  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Last name can only contain letters, spaces, hyphens and apostrophes')
    .optional(),

  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: `Role must be one of: ${Object.values(UserRole).join(', ')}` })
  }).optional(),

  isActive: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// Schema para login de usuário
export const userLoginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .transform(email => email.toLowerCase().trim()),

  password: z.string()
    .min(1, 'Password is required'),
});

// Schema para alteração de senha
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),

  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password must be at most 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'New password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    ),

  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Schema para reset de senha
export const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Reset token is required'),

  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password must be at most 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'New password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    ),

  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Tipo inferido do schema de criação
export type UserCreateInput = z.infer<typeof userCreateSchema>;

// Tipo inferido do schema de atualização
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

// Tipo inferido do schema de login
export type UserLoginInput = z.infer<typeof userLoginSchema>;