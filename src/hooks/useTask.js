
import { useState, useEffect, useCallback } from 'react'
import taskService from '../services/taskService'

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await taskService.getTasks()
      setTasks(data)
    } catch (err) {
      console.error('Gagal mengambil tugas:', err)
      setError('Gagal mengambil data tugas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return { tasks, setTasks, loading, error, fetchTasks }
}
