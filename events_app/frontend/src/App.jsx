// App.jsx


import React from 'react';
import LandingPage from './pages/LandingPage';
import LoginSignup from './pages/LoginSignup';
import NotFound from './pages/NotFound';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import SuccessfulLogin from './pages/SuccessfulLogin';
import StudentDashboard from './pages/StudentDashboard'
import HostScanner from './pages/HostScanner';
import CreateEvent from './pages/CreateEvent';
import HostDashboard from './pages/HostDashboard'


function Logout() {

    localStorage.clear()

    return <Navigate to = '/login' />

}

export default function App() {

    return (

        <BrowserRouter>
        
            <Routes>
                <Route 
                    path = '/'
                    element = {
                        <LandingPage />
                    }
                />

                <Route 
                    path = '/success_login'
                    element = {
                        <ProtectedRoute>
                            <SuccessfulLogin />
                        </ProtectedRoute>
                    }    
                />

                <Route 
                    path = '/student_dashboard'
                    element = {
                        <ProtectedRoute>
                            <StudentDashboard />
                        </ProtectedRoute>
                    }    
                />

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
                {/* <Route path = '/student_dashboard' element = {<StudentDashboard />} />  */}
                <Route path = '/login' element = {<LoginSignup />} />
                <Route path = '/logout' element = {<Logout />} />
                <Route path = '/scan' element = {<HostScanner />} />
                {/* If the user tries to go to any other route apart from the ones defined it'll show error 404 - Not found page */}
                <Route path = '*' element = {<NotFound />} />
                
            </Routes>

        </BrowserRouter>

    );

}
