import { app } from './app.js'
import { db } from './db.js'
import { env } from './env.js'

const server = app.listen(env.port, () => {
  console.log(`api  → http://localhost:${env.port}/api`)
})

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    server.close(() => db.$disconnect().finally(() => process.exit(0)))
  })
}
