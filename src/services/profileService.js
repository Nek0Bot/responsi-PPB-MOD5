import apiClient from '../config/api'

const fromRow = (r) => r && ({
  id: r.id, name: r.name, nim: r.nim,
  group: r.group_name || '', major: r.major || '',
  taskCount: r.tasks?.[0]?.count ?? 0,
})
const toRow = (p) => ({
  name: p.name, nim: p.nim,
  group_name: p.group || '', major: p.major || '',
})
const rep = { headers: { Prefer: 'return=representation' } }

const profileService = {
  async getById(id) {
    const rows = await apiClient.get(`/rest/v1/profiles?id=eq.${id}&select=*`)
    return fromRow(rows[0])
  },
  async getByNim(nim) {
    const rows = await apiClient.get(`/rest/v1/profiles?nim=eq.${encodeURIComponent(nim)}&select=*`)
    return fromRow(rows[0])
  },
  async list() {
    const rows = await apiClient.get('/rest/v1/profiles?select=*,tasks(count)&order=name.asc')
    return Array.isArray(rows) ? rows.map(fromRow) : []
  },
  async create(p) {
    const rows = await apiClient.post('/rest/v1/profiles', toRow(p), rep)
    return fromRow(rows[0])
  },
  async update(id, p) {
    const rows = await apiClient.patch(`/rest/v1/profiles?id=eq.${id}`, toRow(p), rep)
    return fromRow(rows[0])
  },
  async remove(id) {
    return apiClient.delete(`/rest/v1/profiles?id=eq.${id}`)
  },
}

export default profileService