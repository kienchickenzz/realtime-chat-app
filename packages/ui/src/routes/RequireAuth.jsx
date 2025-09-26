import { Navigate } from 'react-router'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

import { useAuth } from '@/hooks/useAuth'

// IMPORTANT: Đặt file này ra 1 chỗ khác hợp lí hơn?!
export const RequireAuth = ( { permission, children } ) => {
    const currentUser = useSelector( ( state ) => state.auth.user )
    const { hasPermission } = useAuth()

    // Redirect to login if user is not authenticated
    if ( !currentUser ) {
        return <Navigate to='/login' replace state={{ path: location.pathname }} />
    }

    if ( permission && !hasPermission( permission ) ) {
        return <Navigate to='/unauthorized' replace />
    }

    return children // Allow access if none of the above conditions match
}

RequireAuth.propTypes = {
    permission: PropTypes.string,
    children: PropTypes.element,
}
