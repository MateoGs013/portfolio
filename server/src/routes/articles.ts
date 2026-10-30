import { Router } from 'express'
import { parseLang } from '../content/lang.js'
import { matchesArticle } from '../content/matches.js'
import { presentArticle, presentArticleSummary } from '../content/present.js'
import { resolve, type Resource, type Wire } from '../content/snapshot.js'
import { isVisibleArticle } from '../content/visibility.js'
import { sendResolved } from '../envelope.js'
import { articleFilters, publicFilters, readFilters, type ArticleFilters } from '../filters.js'
import { getArticle, listArticles, type ArticleRecord } from '../queries/articles.js'

type Article = Wire<ArticleRecord>

export const articleList: Resource<ArticleFilters, Article[], ReturnType<typeof presentArticleSummary>[]> = {
  name: 'articles',
  db: listArticles,
  snapshot: (snap, filters) => snap.articles.filter(a => matchesArticle(a, filters)),
  present: (records, lang) => records.map(a => presentArticleSummary(a, lang)),
}

export const articleDetail: Resource<string, Article, ReturnType<typeof presentArticle>> = {
  name: 'article',
  db: getArticle,
  snapshot: (snap, slug) => snap.articles.find(a => a.slug === slug && isVisibleArticle(a)) ?? null,
  present: presentArticle,
}

export const articles = Router()

/** GET /api/articles?stack=&featured=&project=&lang= — solo publicados, sin el cuerpo. */
articles.get('/articles', async (req, res) => {
  const filters = readFilters(req.query, articleFilters)
  const lang = parseLang(req)
  sendResolved(res, await resolve(articleList, filters, lang), { lang, filters: publicFilters(filters) })
})

/** GET /api/articles/:slug?lang= — el artículo con su markdown. */
articles.get('/articles/:slug', async (req, res) => {
  const lang = parseLang(req)
  sendResolved(res, await resolve(articleDetail, req.params.slug, lang), { lang })
})
