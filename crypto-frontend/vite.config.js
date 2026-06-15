import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// After installing react add this to your config file 
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()]
})
