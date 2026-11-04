
import apiClient from '../config/api'

const taskService = {
  async getTasks() {
    return apiClient.get('/rest/v1/tasks?select=*&order=id.desc')
  },

  async createTask(task) {
    return apiClient.post('/rest/v1/tasks', task, {
      headers: { Prefer: 'return=representation' }
    })
  },

  async updateTask(id, task) {
    return apiClient.patch(`/rest/v1/tasks?id=eq.${id}`, task, {
      headers: { Prefer: 'return=representation' }
    })
  },

  async deleteTask(id) {
    return apiClient.delete(`/rest/v1/tasks?id=eq.${id}`)
  }
}

export default taskService
