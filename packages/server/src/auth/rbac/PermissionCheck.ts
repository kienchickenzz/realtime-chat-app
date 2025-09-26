import { NextFunction, Request, Response } from 'express'

// Check if the user has the required permission for a route
export const checkPermission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        
        const user = req.user
        if (user) {
            const permissions = user.permissions
            if (permissions && permissions.includes(permission)) {
                return next()
            }
        }

        // If user is not logged in, return forbidden
        return res.status(403).json({ message: 'Forbidden' })
    }
}

// Checks for any permission, input is the permissions separated by comma
export const checkAnyPermission = (permissionsString: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        
        const user = req.user
        if (user) {
            const permissions = user.permissions
            const permissionIds = permissionsString.split(',')
            if (permissions && permissions.length) {
                // Split permissions and check if any of the permissions are present in the user's permissions
                for (let i = 0; i < permissionIds.length; i++) {
                    if (permissions.includes(permissionIds[i])) {
                        return next()
                    }
                }
            }
        }

        // If user is not logged in, return forbidden
        return res.status(403).json({ message: 'Forbidden' })
    }
}
