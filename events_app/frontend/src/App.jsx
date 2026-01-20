// App.jsx


import React, {Suspense} from 'react'
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'

import LandingPage from './pages/LandingPage'
import LoginSignup from './pages/LoginSignup'
import NotFound from './pages/NotFound'
import SuccessfulLogin from './pages/SuccessfulLogin'
import HostScanner from './pages/HostScanner'
import CreateEvent from './pages/CreateEvent'
import HostDashboard from './pages/HostDashboard'
import ManageEvent from './pages/ManageEvent'
import SetPassword from './pages/SetPassword'
import ForgotPassword from './pages/RequestPasswordLink'
import ResetPassword from './pages/ResetPassword'
import RequestPasswordLink from './pages/RequestPasswordLink'
import LoadingSpinner from './components/common/LoadingSpinner'


const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'))


function Logout() {

    localStorage.clear()

    return <Navigate to = '/login' />

}

export default function App() {

    return (

        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route 
                    path = '/'
                    element = {
                        <LandingPage />
                    }
                />

                <Route 
                    path = '/login' 
                    element = {<LoginSignup />} 
                />

                <Route 
                    path = '/logout' 
                    element = {<Logout />} 
                />

                <Route 
                    path = '/success_login'
                    element = {
                        <ProtectedRoute>
                            <SuccessfulLogin />
                        </ProtectedRoute>
                    }    
                />

                {/* Password reset links */}
                <Route 
                    path = '/set-password/:uid/:token'
                    element = {
                        <SetPassword />
                    }
                />

                <Route 
                    path = '/request-password'
                    element = {
                        <RequestPasswordLink />
                    }
                />

                <Route 
                    path = '/reset-password'
                    element = {
                        <ResetPassword />
                    }
                />

                {/* Student routes */}
                <Route 
                    path = '/student/dashboard'
                    element = {
                        <ProtectedRoute>
                            <Suspense fallback = {<LoadingSpinner />}>
                                <StudentDashboard />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />
                
                {/* Host routes */}
                <Route 
                    path = '/host/dashboard'
                    element = {
                        <ProtectedRoute>
                            <HostDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route 
                    path = '/host/create-event'
                    element = {
                        <ProtectedRoute>
                            <CreateEvent />
                        </ProtectedRoute>
                    }
                />

                <Route 
                    path = '/host/event/:eventId'
                    element = {
                        <ProtectedRoute>
                            <ManageEvent />
                        </ProtectedRoute>
                    }
                />

                <Route 
                    path = '/host/scan'
                    element = {
                        <ProtectedRoute>
                            <HostScanner />
                        </ProtectedRoute>
                    }
                />
                    
                {/* If the user tries to go to any other route apart from the ones defined it'll show error 404 - Not found page */}
                <Route 
                    path = '*' 
                    element = {<NotFound />} 
                />
            </Routes>
        </BrowserRouter>

    )

}
