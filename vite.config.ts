import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    sourcemap: true,
    minify: false,
    rollupOptions: {
      input: {
        index: 'index.html',
        panel: 'panel.html',
      },
    },
  },
  define: {
    'process.env.NODE_ENV': '"development"',
  },
})
