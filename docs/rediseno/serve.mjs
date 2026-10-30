// Servidor estático mínimo para ver los prototipos: node docs/rediseno/serve.mjs → http://localhost:4321/docs/rediseno/demo.html
// Sirve rangos de bytes (Range) porque los navegadores los piden para reproducir y repetir videos.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
}
const port = Number(process.env.PORT) || 4321

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (path === '/') { res.writeHead(302, { Location: '/docs/rediseno/demo.html' }); return res.end() }
  const file = normalize(join(root, path))
  if (!file.startsWith(root)) { res.writeHead(403); return res.end() }
  try {
    const { size } = await stat(file)
    const type = types[extname(file)] ?? 'application/octet-stream'
    const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '')
    if (range) {
      const start = range[1] ? Number(range[1]) : 0
      const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Cache-Control': 'no-store' })
      return createReadStream(file, { start, end }).pipe(res)
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' })
    res.end(await readFile(file))
  } catch {
    res.writeHead(404); res.end('404')
  }
}).listen(port, () => console.log(`prototipos en http://localhost:${port}/docs/rediseno/`))
