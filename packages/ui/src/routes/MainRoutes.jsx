import { lazy } from 'react'
import { Outlet } from 'react-router-dom'

import Loadable from '@/components/loading/Loadable'

import { RequireAuth } from '@/routes/RequireAuth'

const MainLayout = Loadable(lazy(() => import('@/layout/MainLayout')))
const SettingsPage = Loadable(lazy(() => import('@/pages/SettingsPage')))
const ProfilePage = Loadable(lazy(() => import('@/pages/ProfilePage')))

const HomePage = Loadable(lazy(() => import('@/pages/HomePage')))

const MainRoutes = {
    path: '/',
    element: <MainLayout />,
    children: [
        {
            path: '/',
            element: ( 
                <RequireAuth>
                    <MainLayout />
                </RequireAuth>
            )
        },
        {
            path: '/settings',
            element: ( 
                <RequireAuth permission={ 'documentStores:view' }>
                    <SettingsPage />
                </RequireAuth>
            )
        },
        {
            path: '/profile',
            element: (
                <RequireAuth permission={ 'documentStores:view' }>
                    <ProfilePage />
                </RequireAuth> 
            )
        }
    ]
}

export default MainRoutes
