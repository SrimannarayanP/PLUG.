// apiPublic.js


import axios from 'axios'


const apiPublic = axios.create({
    baseURL : import.meta.env.VITE_API_URL,
    headers : {
        'Content-Type' : 'application/json',
        'Accept' : 'application/json',
    },
    timeout : 10000
})


export default apiPublic
