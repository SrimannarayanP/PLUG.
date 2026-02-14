// apiPublic.js



import axios from 'axios'


const apiPublic = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://plug-production.up.railway.app'
})


export default apiPublic
