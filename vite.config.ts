import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        index: 'index.html',
        panel: 'panel.html',
      },
    },
  },
})
