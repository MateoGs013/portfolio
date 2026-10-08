// Portfolio CMS 2026 · Cliente API Administrativa
// Manejo centralizado de peticiones HTTP a /api/admin/*

export class ApiClient {
  constructor() {
    this.token = sessionStorage.getItem('admin-token') || ''
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

    return body
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

  async updateMediaRole(id, role) {
    return this.fetch(`media/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, alt: 'Imagen de proyecto' }),
    })
  }

  async deleteMedia(id) {
    return this.fetch(`media/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  }

  // Job Hunter & IA
  async getHunterJobs() {
    return this.fetch('hunter/jobs')
  }

  async scanHunterJobs() {
    return this.fetch('hunter/scan', { method: 'POST' })
  }

  async purgeHunterJobs() {
    return this.fetch('hunter/purge', { method: 'POST' })
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
}

export const api = new ApiClient()
