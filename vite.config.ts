import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    sourcemap: true,      // Enables source maps
    minify: false,        // Prevents minification
  },
  define: {
    'process.env.NODE_ENV': '"development"', // Simulates dev environment
  },
})