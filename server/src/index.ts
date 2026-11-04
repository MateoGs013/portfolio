import { startWeeklyArticles } from './admin/articleSchedule.js'
import { app } from './app.js'
import { db } from './db.js'
import { env } from './env.js'

const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`api  → http://0.0.0.0:${env.port}/api`)
  // El artículo de los lunes: solo en producción con Eros, o con ARTICLES_WEEKLY=on.
  startWeeklyArticles()
})

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    server.close(() => db.$disconnect().finally(() => process.exit(0)))
  })
}
