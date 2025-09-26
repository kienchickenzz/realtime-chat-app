import { useSelector } from 'react-redux'

export const useAuth = () => {
    const permissions = useSelector( ( state ) => state.auth.permissions )

    const hasPermission = ( permissionId ) => {
        if ( !permissionId ) return false
        const permissionIds = permissionId.split( ',' )
        if ( permissions && permissions.length ) {
            return permissionIds.some( ( permissionId ) => permissions.includes( permissionId ) )
        }
        return false
    }

    return { hasPermission }
}
