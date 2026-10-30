/**
 * pnpm db:snapshot — genera server/src/snapshot/content.json desde la base, con las mismas consultas
 * de la API y sin filtros: registros crudos en español, con sus translations y solo lo visible.
 * Es el respaldo de la API cuando la base no responde y nunca hubo una respuesta buena guardada.
 */
import fs from 'node:fs'
import { SNAPSHOT_FILE, type ContentSnapshot } from '../content/snapshot.js'
import { db } from '../db.js'
import { listArticles } from '../queries/articles.js'
import { listDocs } from '../queries/docs.js'
import { listExperience } from '../queries/experience.js'
import { listOrgs } from '../queries/orgs.js'
import { listProjects } from '../queries/projects.js'
import { listStack } from '../queries/stack.js'

async function main() {
  const [projects, stack, experience, orgs, docs, articles] = await Promise.all([
    listProjects(),
    listStack(),
    listExperience(),
    listOrgs(),
    listDocs(),
    listArticles(),
  ])
  const snapshot: ContentSnapshot = {
    _generated: 'pnpm db:snapshot — no editar',
    at: new Date().toISOString(),
    projects,
    stack,
    experience,
    orgs,
    docs,
    articles,
  }
  fs.writeFileSync(SNAPSHOT_FILE, `${JSON.stringify(snapshot, null, 2)}\n`)
  console.log(
    `snapshot -> ${projects.length} projects · ${stack.length} techs · ${experience.length} experience`
    + ` · ${orgs.length} orgs · ${docs.length} docs · ${articles.length} articles`,
  )
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
