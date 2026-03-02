// ProtectedRoute.jsx


// The idea here is that this component will wrap around any route that we want to protect. It'll be used to secure certain parts of the website, so that only
// authenticated users can access them. If an unauthorized user tries to access a protected route, they'll be redirected to the login page.
import {jwtDecode} from 'jwt-decode'
import {useCallback, useEffect, useState} from 'react'
import {Navigate, useLocation} from 'react-router-dom'

import api from '../api/api.js'

import {ACCESS_TOKEN, REFRESH_TOKEN} from '../constants'


export default function ProtectedRoute({children, allowedRoles = []}) {

    const location = useLocation()

    const [isAuthorized, setIsAuthorized] = useState(null)
    const [userRole, setUserRole] = useState(null)

    const auth = useCallback(async () => {
        const token = localStorage.getItem(ACCESS_TOKEN)

        if (!token) {
            setIsAuthorized(false)
            
            return
        }

        try {
            const decodedToken = jwtDecode(token)
            const tokenExpiration = decodedToken.exp * 1000 // Convert to ms
            const now = Date.now() / 1000

            if (decodedToken.role) setUserRole(decodedToken.role)

            // Refresh if the token is expiring in less than a minute
            if (tokenExpiration < now + 60) {  // Checks for token expiration
                await refreshToken()
            } else {
                setIsAuthorized(true)
            }
        } catch (error) {
            console.error("Token decoding failed", error)

            setIsAuthorized(false)
        }
    }, [])

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN)

        try {
            const response = await api.post('/api/token/refresh/', {refresh : refreshToken})

            if (response.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, response.data.access)

                const decodedToken = jwtDecode(response.data.access)

                setUserRole(decodedToken.role)
                setIsAuthorized(true)
            } else {
                setIsAuthorized(false)
            }
        } catch (error) {
            console.error(error)

            setIsAuthorized(false)
        }
    }

    useEffect(() => {
        auth().catch(() => setIsAuthorized(false))
        
        // Run when user switches back to the app tab
        const handleFocus = () => {
            auth().catch(() => setIsAuthorized(false))
        }

        window.addEventListener('focus', handleFocus)

        // Run every minute to check for expiration while user is seeing the app
        const interval = setInterval(() => {
            auth().catch(() => setIsAuthorized(false))
        }, 60 * 1000)

        return () => {
            window.removeEventListener('focus', handleFocus)

            clearInterval(interval)
        }

    }, [auth])


    if (isAuthorized === null) {

        return (

            <div className = "flex items-center justify-center min-h-screen bg-[#09090b]">
                <div className = "animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
            </div>

        );

    }  

    // If unauthorised, redirect to login but save where they were trying to go
    if (!isAuthorized) {

        return (
            
            <Navigate 
                to = '/login'
                state = {{from : location}}
                replace
            />

        )

    }

    if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
        
        return (

            <Navigate 
                to = '/unauthorized'
                state = {{from : location}}
                replace
            />

        )

    }

    return children

}
