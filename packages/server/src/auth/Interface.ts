import { z } from 'zod'

export type LoggedInUser = {
    id: string
    email: string
    name: string
    permissions: string[]
    role: string
}

export enum ErrorMessage {
    INVALID_MISSING_TOKEN = 'Invalid or Missing token',
    TOKEN_EXPIRED = 'Token Expired',
    REFRESH_TOKEN_EXPIRED = 'Refresh Token Expired',
    FORBIDDEN = 'Forbidden',
    UNKNOWN_USER = 'Unknown Username or Password',
    INCORRECT_PASSWORD = 'Incorrect Password',
    INACTIVE_USER = 'Inactive User',
    INVITED_USER = 'User Invited, but has not registered',
    INVALID_WORKSPACE = 'No Workspace Assigned',
    UNKNOWN_ERROR = 'Unknown Error'
}

// IMPORTANT: when updating this schema, update the schema on the server as well
// packages/ui/src/views/auth/register.jsx
export const RegisterUserSchema = z
    .object({
        username: z.string().min(1, 'Name is required'),
        email: z.string().min(1, 'Email is required').email('Invalid email address'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/\d/, 'Password must contain at least one digit')
            .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
        confirmPassword: z.string().min(1, 'Confirm Password is required'),
        token: z.string().min(1, 'Invite Code is required')
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword']
    })
