// api.js

// What we're going to create here is something called an interceptor. Basically an interceptor will keep listening to requests that are being made from the frontend to
// the backend. It'll check if the request has the correct headers for authorization. If not, it'll add them automatically. This way, we don't have to manually add the
// authorization headers every time a request is made.

import axios from 'axios'
import {ACCESS_TOKEN} from '../constants'


const api = axios.create({

    baseURL : import.meta.env.VITE_API_URL // This will basically import anything that is stored in the .env file with the key VITE_API_URL
                                            // All I have to do is specify the path I want to access & I don't have to mention the base URL again & again

})

api.interceptors.request.use(

    (config) => {

        const token = localStorage.getItem(ACCESS_TOKEN) // Gets access token from local storage

        if (token && !config.url.includes('/api/token/') && !config.url.includes('/api/user/register/')) {

            config.headers.Authorization = `Bearer ${token}` // This is how you pass a JWT access token

        }

        return config

    },
    (error) => {

        return Promise.reject(error)

    }

)


export default api
