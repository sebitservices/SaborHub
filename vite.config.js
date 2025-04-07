import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Escucha en todas las interfaces de red
    open: true, // Abre automáticamente el navegador
    cors: true  // Habilita CORS
  }
})
