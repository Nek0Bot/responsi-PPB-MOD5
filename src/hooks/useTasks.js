import { useState, useEffect, useCallback } from 'react'
import taskService from '../services/taskService.js'

export function useTasks(profileId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTasks = useCallback(async () => {
    if (!profileId) { setTasks([]); setError(null); setLoading(false); return }
    try {
      setLoading(true)
      setError(null)
      const data = await taskService.getTasks(profileId)
      if (!Array.isArray(data)) throw new Error('Respons bukan array')
      setTasks(data)
    } catch (err) {
      console.error(err)
      setError('Gagal mengambil data tugas.')
    } finally {
      setLoading(false)
    }
  }, [profileId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  return { tasks, setTasks, loading, error, fetchTasks }
}