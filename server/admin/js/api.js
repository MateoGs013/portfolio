// Portfolio CMS 2026 · Cliente API Administrativa
// Manejo centralizado de peticiones HTTP a /api/admin/*

export class ApiClient {
  constructor() {
    this.token = sessionStorage.getItem('admin-token') || ''
    this.onAuthError = null
  }

  setOnAuthError(fn) {
    this.onAuthError = fn
  }

  setToken(t) {
    this.token = t || ''
    if (t) {
      sessionStorage.setItem('admin-token', t)
    } else {
      sessionStorage.removeItem('admin-token')
    }
  }

  getToken() {
    return this.token
  }

  hasToken() {
    return !!this.token
  }

  async fetch(path, init = {}) {
    const headers = {
      Authorization: `Bearer ${this.token}`,
      ...(init.headers || {}),
    }

    const url = `/api/admin/${path.replace(/^\//, '')}`
    const res = await window.fetch(url, { ...init, headers })

    if (res.status === 401) {
      this.setToken('')
      if (typeof this.onAuthError === 'function') {
        this.onAuthError()
      }
      throw new Error('Sesión expirada o token no autorizado. Ingresá la clave de acceso nuevamente.')
    }

    if (res.status === 204) {
      return null
    }

    const contentType = res.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const body = isJson ? await res.json().catch(() => null) : await res.text()

    if (!res.ok) {
      const errorMsg = (body && typeof body === 'object' && body.error) 
        ? body.error 
        : `Error en la solicitud (código ${res.status})`
      throw new Error(errorMsg)
    }

    // Detección de fallback de Eros Agent vía cabecera HTTP
    const isFallbackHeader = res.headers.get('x-eros-source') === 'fallback'
    if (body && typeof body === 'object') {
      if (isFallbackHeader && !body._source) {
        body._source = 'fallback'
      }
      if (Array.isArray(body) && isFallbackHeader) {
        for (const item of body) {
          if (item && typeof item === 'object' && !item._source) {
            item._source = 'fallback'
          }
        }
      }
    }

    return body
  }

  async fetchBlob(path, init = {}) {
    const headers = {
      Authorization: `Bearer ${this.token}`,
      ...(init.headers || {}),
    }

    const url = `/api/admin/${path.replace(/^\//, '')}`
    const res = await window.fetch(url, { ...init, headers })

    if (res.status === 401) {
      this.setToken('')
      if (typeof this.onAuthError === 'function') {
        this.onAuthError()
      }
      throw new Error('Sesión expirada o token no autorizado. Ingresá la clave de acceso nuevamente.')
    }

    if (!res.ok) {
      throw new Error(`Error en la solicitud (código ${res.status})`)
    }

    return res.blob()
  }

  // Métodos de Metadatos
  async getMeta() {
    return this.fetch('meta')
  }

  // Métodos CRUD Genéricos para Colecciones
  async getCollection(path) {
    return this.fetch(path)
  }

  async getRecord(path, id) {
    return this.fetch(`${path}/${encodeURIComponent(id)}`)
  }

  async createRecord(path, payload) {
    return this.fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  async updateRecord(path, id, payload, method = 'PUT') {
    return this.fetch(`${path}/${encodeURIComponent(id)}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  async patchRecord(path, id, partialPayload) {
    return this.fetch(`${path}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partialPayload),
    })
  }

  async deleteRecord(path, id) {
    return this.fetch(`${path}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  }

  // Multimedia (Multipart)
  async uploadMedia(formData) {
    return this.fetch('media', {
      method: 'POST',
      body: formData,
    })
  }

  /** PATCH parcial: el server actualiza solo las claves presentes (alt, caption, role, order, tint, viewport, poster). */
  async updateMedia(id, fields) {
    return this.fetch(`media/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
  }

  async updateMediaRole(id, role) {
    return this.updateMedia(id, { role })
  }

  /** Póster nuevo para un video (multipart: poster + tint opcional). */
  async uploadMediaPoster(id, formData) {
    return this.fetch(`media/${encodeURIComponent(id)}/poster`, {
      method: 'POST',
      body: formData,
    })
  }

  async deleteMedia(id) {
    return this.fetch(`media/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  }

  // Job Hunter & IA
  async getHunterJobs() {
    const res = await this.fetch('hunter/jobs')
    if (Array.isArray(res)) return res
    if (res && Array.isArray(res.data)) return res.data
    return []
  }

  async scanHunterJobs() {
    return this.fetch('hunter/scan?evaluate=false', { method: 'POST' })
  }

  async evaluateHunterJobs(limit = 15) {
    return this.fetch(`hunter/evaluate?limit=${encodeURIComponent(limit)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit }),
    })
  }

  async evaluateHunterJob(id) {
    return this.fetch(`hunter/jobs/${encodeURIComponent(id)}/evaluate`, {
      method: 'POST',
    })
  }

  async purgeHunterJobs() {
    return this.fetch('hunter/purge', { method: 'POST' })
  }

  async deleteAllHunterJobs() {
    return this.fetch('hunter/jobs', { method: 'DELETE' })
  }

  async deleteHunterJob(id) {
    return this.fetch(`hunter/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  async semanticSearchHunterJobs(query, limit = 30) {
    return this.fetch('hunter/search/semantic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit }),
    })
  }

  async vectorizeHunterJobs(limit = 100) {
    return this.fetch('hunter/vectorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit }),
    })
  }

  async updateHunterJobStatus(id, status) {
    return this.fetch(`hunter/jobs/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  async generateHunterPitch(id) {
    return this.fetch(`hunter/jobs/${encodeURIComponent(id)}/pitch`, {
      method: 'POST',
    })
  }

  async generateHunterCV(id) {
    return this.fetch(`hunter/jobs/${encodeURIComponent(id)}/cv`, {
      method: 'POST',
    })
  }

  async getHunterCVTicket(id) {
    return this.fetch(`hunter/cv/${encodeURIComponent(id)}/ticket`, {
      method: 'POST',
    })
  }

  async downloadHunterCVHtml(id) {
    return this.fetchBlob(`hunter/cv/${encodeURIComponent(id)}/html?download=true`)
  }

  async downloadHunterCVPdf(id) {
    return this.fetchBlob(`hunter/cv/${encodeURIComponent(id)}/pdf?download=true`)
  }

  async getHunterJobApplyPreview(id) {
    return this.fetch(`hunter/jobs/${encodeURIComponent(id)}/apply-preview`)
  }

  async findHunterJobEmail(id) {
    return this.fetch(`hunter/jobs/${encodeURIComponent(id)}/find-email`, {
      method: 'POST',
    })
  }

  async applyHunterJobByEmail(id, data = {}) {
    return this.fetch(`hunter/jobs/${encodeURIComponent(id)}/apply-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  async updateHunterJobContactEmail(id, contact_email) {
    return this.fetch(`hunter/jobs/${encodeURIComponent(id)}/contact-email`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_email }),
    })
  }

  // Eros Omnichannel Content (Career OS)
  async getContentPosts(status = null, limit = 50) {
    const q = new URLSearchParams()
    if (status && status !== 'all') q.set('status', status)
    if (limit) q.set('limit', String(limit))
    const queryStr = q.toString() ? `?${q.toString()}` : ''
    const res = await this.fetch(`content/posts${queryStr}`)
    if (Array.isArray(res)) return res
    if (res && Array.isArray(res.data)) return res.data
    return []
  }

  async getContentPost(id) {
    return this.fetch(`content/posts/${encodeURIComponent(id)}`)
  }

  async generateContent(payload) {
    return this.fetch('content/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  async publishContentPost(id) {
    return this.fetch(`content/posts/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
    })
  }

  async updateContentPostStatus(id, status) {
    return this.fetch(`content/posts/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  async deleteContentPost(id) {
    return this.fetch(`content/posts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  }

  async publishPostToBlog(id) {
    return this.fetch(`content/posts/${encodeURIComponent(id)}/publish-to-blog`, {
      method: 'POST',
    })
  }

  async getCarouselTicket(id) {
    return this.fetch(`content/carousel/${encodeURIComponent(id)}/ticket`, {
      method: 'POST',
    })
  }

  getCarouselUrl(id) {
    return `/api/admin/content/carousel/${encodeURIComponent(id)}/html`
  }

  // Eros TrendRadar (Radar de Tendencias Técnicas)
  async getRadarTrends(status = null, minScore = null, limit = 50) {
    const q = new URLSearchParams()
    if (status && status !== 'all') q.set('status', status)
    if (minScore !== null && minScore !== undefined) q.set('min_score', String(minScore))
    if (limit) q.set('limit', String(limit))
    const queryStr = q.toString() ? `?${q.toString()}` : ''
    const res = await this.fetch(`radar/trends${queryStr}`)
    if (Array.isArray(res)) return res
    if (res && Array.isArray(res.data)) return res.data
    return []
  }

  async scanRadar(limit = 15) {
    return this.fetch(`radar/scan?limit=${limit}`, {
      method: 'POST',
    })
  }

  async getRadarTrend(id) {
    return this.fetch(`radar/trends/${encodeURIComponent(id)}`)
  }

  async updateRadarTrendStatus(id, status) {
    return this.fetch(`radar/trends/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  async generateFromRadarTrend(id, payload = {}) {
    return this.fetch(`radar/trends/${encodeURIComponent(id)}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }
}

export const api = new ApiClient()
