import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base debe coincidir con el nombre del repo para que GitHub Pages
// sirva los assets desde https://<usuario>.github.io/kanban/
export default defineConfig({
  base: '/kanban/',
  plugins: [react()],
})
