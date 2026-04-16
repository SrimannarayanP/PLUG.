import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'


export default defineConfig({

    plugins: [
        react(), 
        tailwindcss(),
        basicSsl(),
    ],
    build : {
        minify : 'terser', // Remove all unnecessary chars like spaces, comments, newlines from code
        rollupOptions : {
            manualChunks(id) {
                // Put all libs in separate 'vendor' chunks.
                if (id.includes('node_modules')) {
                    // Split huge libs into their own chunks.
                    if (id.includes('lucide-react')) {

                        return 'icons'

                    }

                    if (id.includes('framer-motion')) {

                        return 'animation'

                    }

                    return vendor
                }
            }
        }
    },
    server : {
        host : true,
        proxy : {
            '/api' : {
                target : 'http://127.0.0.1:8000',
                changeOrigin : true,
            },
        }
    }

})
