import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/**
 * El admin nuevo: Vue + TypeScript compilado por Vite y servido por la API (server/src/admin/uiNext.ts).
 *
 * La base es absoluta a propósito. Con './' una visita a /admin-next sin barra final pediría
 * /assets/* al sitio y daría 404. Mientras conviva con el admin actual vive en /admin-next/; S1 la
 * pasa a /admin/ con ADMIN_BASE.
 *
 * `pnpm dev:admin` levanta Vite en ADMIN_DEV_PORT (3002) y le pasa /api a la API local
 * (ADMIN_API_ORIGIN, http://localhost:3001), así el navegador habla con un solo origen.
 */
const base = process.env.ADMIN_BASE ?? '/admin-next/'
const apiOrigin = process.env.ADMIN_API_ORIGIN ?? 'http://localhost:3001'
const devPort = Number(process.env.ADMIN_DEV_PORT ?? 3002)

export default defineConfig({
  root: fileURLToPath(new URL('./src', import.meta.url)),
  base,
  publicDir: false,
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { '@shared': fileURLToPath(new URL('../src/shared', import.meta.url)) },
  },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    assetsDir: 'assets',
    // Las fuentes van como archivo: la CSP no admite data: en font-src.
    assetsInlineLimit: 0,
    target: 'es2023',
  },
  server: {
    port: devPort,
    strictPort: true,
    proxy: { '/api': { target: apiOrigin, changeOrigin: true } },
  },
  preview: { port: devPort, strictPort: true },
})
