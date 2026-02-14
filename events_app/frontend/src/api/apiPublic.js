// apiPublic.js



import axios from 'axios'


const apiPublic = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})


export default apiPublic
