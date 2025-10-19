// ProtectedRoute.jsx


import {Navigate} from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
import api from '../api';
import {REFRESH_TOKEN, ACCESS_TOKEN} from '../constants';
import {useState, useEffect} from "react";

// A protected route is basically used to restrict certain parts of the app to users. These parts would only be unlocked to the users if they are authenticated. Only
// authorized users can pass through this route.
function ProtectedRoute({children}) {

    const [isAuthorized, setIsAuthorized] = useState(null)

    useEffect (() => {

        auth().catch(() => setIsAuthorized(false))

    }, [])

    const refreshToken = async () => {

        const refreshToken = localStorage.getItem(REFRESH_TOKEN) // Gets the refresh token from local storage

        try {

            // Here we're using api.post, remember that api.js is going to handle the base URL for us, all we did was just specified the route
            const response = await api.post('/api/token/refresh/', {refresh : refreshToken}) // Sends the refresh token to the specified route & stores it in
                                                                                                    // response

            // If we get a successful response from the backend, we update the access token in the local storage with the new access token from response
            if (response.status === 200) {

                localStorage.setItem(ACCESS_TOKEN, response.data.access)

                setIsAuthorized(true) // Authorizes the user once the new access token is received

            } else {

                setIsAuthorized(false)

            }

        } catch (error) {

            console.log(error)
            
            setIsAuthorized(false)

        }

    }
    const auth = async() => {

        const token = localStorage.getItem(ACCESS_TOKEN); // Gets the access token from local storage

        if (!token) {

            setIsAuthorized(false)

            return

        }

        try {

            const decoded = jwtDecode(token); // Decodes the JWT access token
            const tokenExpiration = decoded.exp; // Gets the expiration date for the access token
            const now = Date.now() / 1000; // Gets the date in seconds (x / 1000 converts x from ms to s)

            // This is to check if the token is expired or not. If it is expired, then wait for the refreshToken func. If it is not expired, then we know the token is valid &
            // simply authorize the user
            if (tokenExpiration < now) {

                await refreshToken()

            } else {

                setIsAuthorized(true)

            }    

        } catch (error) {

            console.log("Token decode error : ", error)

            setIsAuthorized(False)

        }

    }

    if (isAuthorized === null) {

        return (

            <div className = "flex items-center justify-center min-h-screen bg-black">
                <div className = "animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
            </div>

        );

    }

    return isAuthorized ? children : <Navigate to = '/login' />

}


export default ProtectedRoute;
