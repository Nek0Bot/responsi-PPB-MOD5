import apiClient from '../config/api'

const rep = { headers: { Prefer: 'return=representation' } }

const taskService = {
  async getTasks(profileId) {
    return apiClient.get(`/rest/v1/tasks?select=*&profile_id=eq.${profileId}&order=id.desc`)
  },
  async createTask(task) {
    return apiClient.post('/rest/v1/tasks', task, rep)
  },
  async updateTask(id, task) {
    return apiClient.patch(`/rest/v1/tasks?id=eq.${id}`, task, rep)
  },
  async deleteTask(id) {
    return apiClient.delete(`/rest/v1/tasks?id=eq.${id}`)
  },
}

export default taskService