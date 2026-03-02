// App.jsx


import {lazy, Suspense} from 'react'
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'

import LoadingSpinner from './components/common/LoadingSpinner'


// Lazy loading: Tells React to not include in index.js. Make separate files.
const CreateEvent = lazy(() => import('./pages/CreateEvent'))
const HostDashboard = lazy(() => import('./pages/HostDashboard'))
const HostScanner = lazy(() => import('./pages/HostScanner'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginSignup = lazy(() => import('./pages/LoginSignup'))
const ManageEvent = lazy(() => import('./pages/ManageEvent'))
const MockCheckout = lazy(() => import('./pages/MockCheckout'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const RequestPasswordLink = lazy(() => import('./pages/RequestPasswordLink'))
const SetPassword = lazy(() => import('./pages/SetPassword'))
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const Unauthorized = lazy(() => import('./pages/Unauthorized'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))


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
                        <Suspense fallback = {<LoadingSpinner />}>
                            <LandingPage />
                        </Suspense>
                    }
                />

                <Route
                    path = '/login'
                    element = {
                        <Suspense fallback = {<LoadingSpinner />}>
                            <LoginSignup />
                        </Suspense>
                    } 
                />

                <Route 
                    path = '/logout' 
                    element = {
                        <Suspense fallback = {<LoadingSpinner />}>
                            <Logout />
                        </Suspense>
                    } 
                />

                <Route 
                    path = '/verify-email'
                    element = {
                        <ProtectedRoute>
                            <Suspense fallback = {<LoadingSpinner />}>
                                <VerifyEmail />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                <Route 
                    path = '/onboarding'
                    element = {
                        <ProtectedRoute>
                            <Suspense fallback = {<LoadingSpinner />}>
                                <Onboarding />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                {/* Password reset links */}
                <Route 
                    path = '/set-password/:uid/:token'
                    element = {
                        <Suspense fallback = {<LoadingSpinner />}>
                            <SetPassword />
                        </Suspense>
                    }
                />

                <Route 
                    path = '/request-password'
                    element = {
                        <Suspense fallback = {<LoadingSpinner />}>
                            <RequestPasswordLink />
                        </Suspense>
                    }
                />

                {/* Profile route */}
                <Route 
                    path = '/profile'
                    element = {
                        <ProtectedRoute>
                            <Suspense fallback = {<LoadingSpinner />}>
                                <UserProfile />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                {/* Student routes */}
                <Route 
                    path = '/student/dashboard'
                    element = {
                        <ProtectedRoute allowedRoles = {['student', 'admin']}>
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
                        <ProtectedRoute allowedRoles = {['host', 'admin']}>
                            <Suspense fallback = {<LoadingSpinner />}>
                                <HostDashboard />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                <Route 
                    path = '/host/create-event'
                    element = {
                        <ProtectedRoute allowedRoles = {['host', 'admin']}>
                            <Suspense fallback = {<LoadingSpinner />}>
                                <CreateEvent />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                <Route 
                    path = '/host/event/:eventId'
                    element = {
                        <ProtectedRoute allowedRoles = {['host', 'admin']}>
                            <Suspense fallback = {<LoadingSpinner />}>
                                <ManageEvent />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                <Route 
                    path = '/host/scan'
                    element = {
                        <ProtectedRoute allowedRoles = {['host', 'admin']}>
                            <Suspense fallback = {<LoadingSpinner />}>
                                <HostScanner />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />
                
                {/* Checkout route */}
                {/* <Route 
                    path = '/checkout'
                    element = {
                        <ProtectedRoute>
                            <Suspense fallback = {<LoadingSpinner />}>
                                <MockCheckout />
                            </Suspense>
                        </ProtectedRoute>
                    }
                /> */}

                {/* If the user tries to go to any other route apart from the ones defined it'll show error 404 - Not found page */}
                <Route 
                    path = '*'
                    element = {
                        <Suspense fallback = {<LoadingSpinner />}>
                            <NotFound />
                        </Suspense>
                    } 
                />

                <Route 
                    path = '/unauthorized'
                    element = {
                        <Suspense fallback = {<LoadingSpinner />}>
                            <Unauthorized />
                        </Suspense>
                    }
                />
            </Routes>
        </BrowserRouter>

    )

}
