import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base relativo: funziona su GitHub Pages indipendentemente dal nome del repo
export default defineConfig({
  plugins: [react()],
  base: './',
  // exceljs viene caricato solo al momento dell'esportazione
  build: { chunkSizeWarningLimit: 1000 },
})
