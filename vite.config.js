import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Escucha en todas las interfaces de red
    open: true, // Abre automáticamente el navegador
    cors: true,  // Habilita CORS
    proxy: {
      '/firebase': {
        target: 'https://firestore.googleapis.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/firebase/, '')
      }
    }
  },
  // base: '/saborhub/', // Comentado - Solo usar en producción
  optimizeDeps: {
    exclude: ['firebase', 'firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage']
  }
})
