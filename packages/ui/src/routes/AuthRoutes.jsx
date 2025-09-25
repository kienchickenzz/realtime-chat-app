import { lazy } from 'react'

import Loadable from '@/components/loading/Loadable'
import AuthLayout from '@/layout/AuthLayout'

const ResolveLoginPage = Loadable(lazy(() => import('@/views/auth/login')))
const SignInPage = Loadable(lazy(() => import('@/views/auth/signIn')))
const RegisterPage = Loadable(lazy(() => import('@/views/auth/register')))
const LoginPage = Loadable(lazy(() => import('@/pages/LoginPage')))
const SignUpPage = Loadable(lazy(() => import('@/pages/SignUpPage')))
const ForgotPasswordPage = Loadable(lazy(() => import('@/views/auth/forgotPassword')))
const ResetPasswordPage = Loadable(lazy(() => import('@/views/auth/resetPassword')))
const UnauthorizedPage = Loadable(lazy(() => import('@/views/auth/unauthorized')))

const AuthRoutes = {
    path: '/',
    element: <AuthLayout />,
    children: [
        {
            path: '/login',
            element: <ResolveLoginPage />
        },
        {
            path: '/signin',
            element: <SignInPage />
        },
        {
            path: '/register',
            element: <RegisterPage />
        },
        {
            path: '/signup',
            element: <SignUpPage />
        },
        {
            path: '/forgot-password',
            element: <ForgotPasswordPage />
        },
        {
            path: '/reset-password',
            element: <ResetPasswordPage />
        },
        {
            path: '/unauthorized',
            element: <UnauthorizedPage />
        },
    ]
}

export default AuthRoutes
