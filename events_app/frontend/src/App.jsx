// App.jsx


import {lazy, Suspense, useEffect} from 'react'
import {Toaster} from 'react-hot-toast'
import {BrowserRouter, Navigate, Route, Routes, Outlet} from 'react-router-dom'

import AxiosInterceptor from './components/AxiosInterceptor'
import ProtectedRoute from './components/ProtectedRoute'

import LoadingSpinner from './components/common/LoadingSpinner'
import Footer from './components/layout/Footer'
import Header from './components/layout/Header'

import {AuthProvider} from './context/AuthContext'
import {DialogProvider} from './context/DialogContext'


// Lazy loading: Tells React to not include in index.js. Make separate files.
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const CreateEvent = lazy(() => import('./pages/CreateEvent'))
const HostDashboard = lazy(() => import('./pages/HostDashboard'))
const HostScanner = lazy(() => import('./pages/HostScanner'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginSignup = lazy(() => import('./pages/LoginSignup'))
const ManageEvent = lazy(() => import('./pages/ManageEvent'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const RequestPasswordLink = lazy(() => import('./pages/RequestPasswordLink'))
const SetPassword = lazy(() => import('./pages/SetPassword'))
const SessionExpired = lazy(() => import('./pages/SessionExpired'))
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const Unauthorized = lazy(() => import('./pages/Unauthorized'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))

const TermsConditions = lazy(() => import('./pages/legal/TermsConditions'))
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'))
const Refund = lazy(() => import('./pages/legal/Refund'))
const ContactUs = lazy(() => import('./pages/legal/ContactUs'))


function Logout() {
    useEffect(() => {
        localStorage.clear()
    }, [])

    return <Navigate to = '/login' />
}

function MainLayout() {

    return (

        <>
            <Header />

            <main className = "pt-[72px] md:pt-[96px]">
                <Outlet />
            </main>

            <Footer />
        </>

    )

}

export default function App() {

    return (

        <DialogProvider>
            <AuthProvider>
                <Toaster
                    position = 'top-center'
                    toastOptions = {{
                        style : {
                            background : '#18181b',
                            color : '#fff',
                            border : "1px solid #27272a"
                        }
                    }}
                />

                <BrowserRouter>
                    <AxiosInterceptor>
                        <Suspense fallback = {<LoadingSpinner />}>
                            <Routes>
                                {/* ROUTES WITHOUT HEADER */}
                                {/* Public Routes */}
                                <Route
                                    path = '/login'
                                    element = {<LoginSignup />}
                                />

                                <Route 
                                    path = '/logout' 
                                    element = {<Logout />}
                                />

                                {/* Password reset links */}
                                <Route 
                                    path = '/set-password/:uid/:token'
                                    element = {<SetPassword />}
                                />

                                <Route 
                                    path = '/request-password'
                                    element = {<RequestPasswordLink />}
                                />

                                {/* If the user tries to go to any other route apart from the ones defined it'll show error 404 - Not found page */}
                                <Route 
                                    path = '*'
                                    element = {<NotFound />}
                                />

                                {/* Safety Routes */}
                                <Route 
                                    path = '/unauthorized'
                                    element = {<Unauthorized />}
                                />

                                <Route 
                                    path = '/session-expired'
                                    element = {<SessionExpired />}
                                />

                                <Route
                                    path = '/verify-email'
                                    element = {
                                        <ProtectedRoute>
                                            <VerifyEmail />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path = '/onboarding'
                                    element = {
                                        <ProtectedRoute>
                                            <Onboarding />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* ROUTES WITH HEADER */}
                                <Route element = {<MainLayout />}>
                                    <Route 
                                        path = '/'
                                        element = {<LandingPage />}
                                    />

                                    <Route
                                        path = '/terms-conditions'
                                        element = {<TermsConditions />}
                                    />

                                    <Route
                                        path = '/privacy-policy'
                                        element = {<PrivacyPolicy />}
                                    />

                                    <Route
                                        path = '/refund-policy'
                                        element = {<Refund />}
                                    />

                                    <Route
                                        path = '/contact-us'
                                        element = {<ContactUs />}
                                    />

                                    <Route
                                        path = '/events/category/:id'
                                        element = {<CategoryPage />}
                                    />

                                    {/* Profile route */}
                                    <Route 
                                        path = '/profile'
                                        element = {
                                            <ProtectedRoute>
                                                <UserProfile />
                                            </ProtectedRoute>
                                        }
                                    />

                                    {/* Student routes */}
                                    <Route 
                                        path = '/student/dashboard'
                                        element = {
                                            <ProtectedRoute allowedRoles = {['student', 'admin']}>
                                                <StudentDashboard />
                                            </ProtectedRoute>
                                        }
                                    />
                                    
                                    {/* Host routes */}
                                    <Route 
                                        path = '/host/dashboard'
                                        element = {
                                            <ProtectedRoute allowedRoles = {['host', 'admin']}>
                                                <HostDashboard />
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route 
                                        path = '/host/create-event'
                                        element = {
                                            <ProtectedRoute allowedRoles = {['host', 'admin']}>
                                                <CreateEvent />
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route 
                                        path = '/host/event/:eventId'
                                        element = {
                                            <ProtectedRoute allowedRoles = {['host', 'admin']}>
                                                <ManageEvent />
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route 
                                        path = '/host/scan'
                                        element = {
                                            <ProtectedRoute allowedRoles = {['host', 'admin']}>
                                                <HostScanner />
                                            </ProtectedRoute>
                                        }
                                    />
                                </Route>
                            </Routes>
                        </Suspense>
                    </AxiosInterceptor>
                </BrowserRouter>
            </AuthProvider>
        </DialogProvider>

    )

}
