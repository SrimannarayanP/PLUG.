// HostProtectedRoute.jsx


import {Navigate, Outlet} from 'react-router-dom'

import {useAuth} from '../../context/AuthContext'

import LoadingSpinner from '../common/LoadingSpinner'


export default function HostProtectedRoute() {

    const {user, loading} = useAuth()

    if (loading) {

        return <LoadingSpinner />

    }

    if (!user) {

        return (

            <Navigate
                to = '/login'
                replace
            />

        )

    }

    const isHost = Boolean(user && Array.isArray(user?.profile) && user.profile.length > 0)
    const isVerified = Boolean(user && Array.isArray(user?.profile) && user.profile.some(club => club.is_verified))

    if (!isHost) {

        return (

            <Navigate
                to = '/student/dashboard'
                replace
            />

        )

    }

    if (!isVerified) {

        return (

            <Navigate
                to = '/host/pending-verification'
                replace
            />

        )

    }

    return <Outlet />

}
