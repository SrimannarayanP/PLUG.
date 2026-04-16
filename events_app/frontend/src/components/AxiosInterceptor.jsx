// AxiosInterceptor.jsx


import axios from 'axios'
import {useEffect} from 'react'
import {useNavigate} from 'react-router-dom'

import api from '../api/api'

import {useAuth} from '../context/AuthContext'

import {ACCESS_TOKEN, REFRESH_TOKEN} from '../constants'


let isRefreshing = false

let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })

    failedQueue = []
}

export default function AxiosInterceptor({children}) {

    const {logout} = useAuth()
    
    const navigate = useNavigate()

    useEffect(() => {
        const responseInterceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config

                if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/api/auth/refresh/')) {
                    originalRequest._retry = true // Lock the retry so no infinite loop is created

                    // If another request is already refreshing the token, queue this request.
                    if (isRefreshing) {
                        
                        return new Promise(function(resolve, reject) {
                            failedQueue.push({resolve, reject})
                        }).then(token => {
                            originalRequest.headers.Authorization = `Bearer ${token}`

                            return api(originalRequest)
                        }).catch(err => {
                            
                            return Promise.reject(err)

                        })

                    }
                    
                    isRefreshing = true

                    try {
                        const refreshToken = localStorage.getItem(REFRESH_TOKEN)

                        if (!refreshToken) throw new Error("No refresh token available")

                        const res = await axios.post(`${api.defaults.baseURL}/api/auth/refresh/`, {refresh : refreshToken})

                        localStorage.setItem(ACCESS_TOKEN, res.data.access)

                        // Update default headers for future requests
                        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`
                        originalRequest.headers.Authorization = `Bearer ${res.data.access}`
                        
                        processQueue(null, res.data.access) // Process all queued requests with the new token

                        return api(originalRequest)
                    } catch (refreshError) {
                        // Refresh token is dead. Session is officially over.
                        processQueue(refreshError, null) // Reject everything in the queue
                        
                        logout()

                        navigate('/session-expired', {replace : true})

                        return Promise.reject(refreshError)
                    } finally {
                        isRefreshing = false
                    }
                }

                if (error.response?.status === 401) {
                    logout()

                    navigate('/session-expired', {replace : true})
                }

                return Promise.reject(error)
            }
        )

        return () => api.interceptors.response.eject(responseInterceptor)
    }, [logout, navigate])

    return children

}
