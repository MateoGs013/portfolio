import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test'

/**
 * La suite corre contra el build de producción: el servidor web es `pnpm build && node
 * .output/server/index.mjs` y la API se levanta al lado. Los puertos van por variable para que cada
 * copia del repo use los suyos: PW_WEB_PORT (3000) y PW_API_PORT (3001). El build fija el proxy de
 * /api, /media y /admin con NUXT_PUBLIC_API_BASE, así que se compila con el puerto de la API de la
 * prueba. PLAYWRIGHT_BASE_URL apunta a un sitio ya levantado y entonces no se arranca nada.
 *
 * `pnpm test:e2e` (tests/e2e/run.mjs) compila una vez (PW_SKIP_BUILD en las corridas) y corre cada
 * spec de cada proyecto con una API recién levantada: el límite de la API pública es de 300 pedidos
 * cada 15 minutos por IP y la suite entera pasa de largo ese número.
 *
 * Proyectos: 375, 768 y 1440 px en oscuro y en claro, uno con reduced motion y uno sin JS. Las specs
 * que no dependen del ancho ni del tema corren una sola vez, en 1440 oscuro.
 */
const webPort = process.env.PW_WEB_PORT || '3000'
const apiPort = process.env.PW_API_PORT || '3001'
const external = process.env.PLAYWRIGHT_BASE_URL
const baseURL = external || `http://localhost:${webPort}`
const apiBase = `http://localhost:${apiPort}/api`

// El token del admin: el de la variable, el del .env local o uno de esta corrida. Los workers vuelven
// a leer este archivo y heredan el entorno, así que todos ven el mismo valor. Nunca se imprime.
const fileEnv = existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')) : {}
process.env.PW_ADMIN_TOKEN ??= process.env.ADMIN_TOKEN || fileEnv.ADMIN_TOKEN || randomBytes(24).toString('hex')

type Theme = 'dark' | 'light'
type Use = NonNullable<PlaywrightTestConfig['use']>

/** El tema llega como lo deja el sitio: la cookie pf-theme, leída por el SSR. */
const theme = (value: Theme): Use => ({
  storageState: {
    cookies: [{ name: 'pf-theme', value, domain: new URL(baseURL).hostname, path: '/', expires: -1, httpOnly: false, secure: false, sameSite: 'Lax' }],
    origins: [],
  },
})

const widths: Record<number, Use> = {
  375: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } },
  768: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
  1440: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
}

/** Lo que cambia con el ancho o con el tema: accesibilidad y estabilidad del layout. */
const LAYOUT = ['**/a11y.spec.ts', '**/cls.spec.ts']
/** Teclado: no depende del tema, sí del ancho (menú angosto, galería en columna). */
const KEYS = [...LAYOUT, '**/keyboard.spec.ts']

const matrix = (width: number, t: Theme) => ({ name: `${width}-${t}`, use: { ...widths[width], ...theme(t) } })

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60000,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: external
    ? undefined
    : [
        {
          command: 'pnpm start:api',
          url: `${apiBase}/schema`,
          reuseExistingServer: !process.env.PW_FRESH_SERVERS,
          timeout: 60000,
          // Eros real nunca: el Job Hunter corre con su respaldo desde la base.
          env: { API_PORT: apiPort, PORT: apiPort, ADMIN_TOKEN: process.env.PW_ADMIN_TOKEN, HUNTER_API_URL: 'http://127.0.0.1:9', EROS_API_KEY: 'offline' },
        },
        {
          command: process.env.PW_SKIP_BUILD ? 'node .output/server/index.mjs' : 'pnpm build && node .output/server/index.mjs',
          url: baseURL,
          reuseExistingServer: !process.env.PW_FRESH_SERVERS,
          timeout: process.env.PW_SKIP_BUILD ? 60000 : 600000,
          env: { PORT: webPort, NUXT_PUBLIC_API_BASE: apiBase, NUXT_PUBLIC_SITE_URL: baseURL },
        },
      ],
  projects: [
    // Todo lo que no depende del ancho ni del tema corre acá una sola vez.
    { ...matrix(1440, 'dark'), testIgnore: ['**/nojs.spec.ts', '**/motion.spec.ts'] },
    { ...matrix(1440, 'light'), testMatch: LAYOUT },
    { ...matrix(768, 'dark'), testMatch: KEYS },
    { ...matrix(768, 'light'), testMatch: LAYOUT },
    { ...matrix(375, 'dark'), testMatch: KEYS },
    { ...matrix(375, 'light'), testMatch: LAYOUT },
    {
      name: 'reduced-motion',
      testMatch: ['**/motion.spec.ts', '**/keyboard.spec.ts', '**/cls.spec.ts'],
      use: { ...widths[1440], ...theme('dark'), reducedMotion: 'reduce' },
    },
    {
      name: 'no-js',
      testMatch: '**/nojs.spec.ts',
      use: { ...widths[1440], ...theme('dark'), javaScriptEnabled: false },
    },
  ],
})
