// AuthContext.jsx


import {createContext, useContext, useEffect, useState} from 'react'

import api from '../api/api'

import {ACCESS_TOKEN, REFRESH_TOKEN} from '../constants'


const AuthContext = createContext(null)

export const AuthProvider = ({children}) => {

    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const [user, setUser] = useState(null)

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem(ACCESS_TOKEN)

            if (token) {
                try {
                    const response = await api.get('/api/user/profile/')

                    setUser(response.data)
                    setIsAuthenticated(true)
                } catch (error) {
                    console.error("Session restoration failed:", error)

                    localStorage.removeItem(ACCESS_TOKEN)
                    localStorage.removeItem(REFRESH_TOKEN)

                    setIsAuthenticated(false)
                    setUser(null)
                }
            } else {
                setIsAuthenticated(false)
                setUser(null)
            }

            setIsLoading(false)
        }

        initializeAuth()
    }, [])

    const login = async (access, refresh) => {
        localStorage.setItem(ACCESS_TOKEN, access)
        localStorage.setItem(REFRESH_TOKEN, refresh)

        try {
            const response = await api.get('/api/user/profile/')

            setUser(response.data)
            setIsAuthenticated(true)
        } catch (error) {
            console.error("Failed to fetch full profile during login: ", error)

            logout()
        }

    }

    const logout = () => {
        localStorage.removeItem(ACCESS_TOKEN)
        localStorage.removeItem(REFRESH_TOKEN)

        setUser(null)
        setIsAuthenticated(false)
    }

    if (isLoading) {

        return (

            <div className = "min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className = "animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
            </div>

        )

    }

    return (

        <AuthContext.Provider value = {{isAuthenticated, login, logout, user}}>
            {children}
        </AuthContext.Provider>

    )

}

export const useAuth = () => useContext(AuthContext)
