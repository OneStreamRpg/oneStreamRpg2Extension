import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    sourcemap: true,      // Enables source maps
    minify: false,        // Prevents minification
  },
  define: {
    'process.env.NODE_ENV': '"development"', // Simulates dev environment
  },
})