// ProtectedRoute.jsx


// The idea here is that this component will wrap around any route that we want to protect. It'll be used to secure certain parts of the website, so that only
// authenticated users can access them. If an unauthorized user tries to access a protected route, they'll be redirected to the login page.
import {Navigate, useLocation} from 'react-router-dom'

import {useAuth} from '../context/AuthContext'


export default function ProtectedRoute({children, allowedRoles = []}) {

    const {isAuthenticated, user} = useAuth()
    const location = useLocation()

    if (!isAuthenticated) {

        return (

            <Navigate
                to = '/login'
                state = {{from : location}}
                replace
            />

        )

    }

    if (allowedRoles.length > 0) {
        const hasRequiredRole = allowedRoles.some(role => {
            const isHost = Boolean(user?.profile?.host_type)

            if (role === 'host') return isHost === true
            if (role === 'student') return true

            return false
        })

        if (!hasRequiredRole) {
            
            return (

                <Navigate
                    to = '/unauthorized'
                    replace
                />

            )

        }
    }

    return children

}
