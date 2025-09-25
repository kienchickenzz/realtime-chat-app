import { lazy } from 'react'
import { Outlet } from 'react-router-dom'

import Loadable from '@/components/loading/Loadable'

const HomePage = Loadable(lazy(() => import('@/pages/HomePage')))
const SettingsPage = Loadable(lazy(() => import('@/pages/SettingsPage')))
const ProfilePage = Loadable(lazy(() => import('@/pages/ProfilePage')))

const MainRoutes = {
    path: '/',
    element: <Outlet />,
    children: [
        {
            path: '/',
            element: <HomePage />
        },
        {
            path: '/settings',
            element: <SettingsPage />
        },
        {
            path: '/profile',
            element: <ProfilePage />
        }
    ]
}

export default MainRoutes
