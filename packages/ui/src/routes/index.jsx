import { useRoutes } from 'react-router-dom'

import config from '@/config'
import AuthRoutes from '@/routes/AuthRoutes'
import MainRoutes from '@/routes/MainRoutes'

export default function ThemeRoutes() {
    return useRoutes( [ MainRoutes, AuthRoutes ], config.basename )
}
