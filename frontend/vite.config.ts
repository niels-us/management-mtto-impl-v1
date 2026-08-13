import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@app': r('./src/app'),
      '@pages': r('./src/pages'),
      '@features': r('./src/features'),
      '@entities': r('./src/entities'),
      '@shared': r('./src/shared'),
    },
  },
})
