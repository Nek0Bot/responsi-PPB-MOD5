/// <reference types="vite/client" />

import axios from 'axios'

const {
  VITE_API_BASE_URL: BASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: SUPABASE_KEY,
} = import.meta.env

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  },
  timeout: 10000,
})

apiClient.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default apiClient