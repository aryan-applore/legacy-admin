// DRY: Shared API helper functions
import { useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api'

// Reusable API fetch helper
export const useApiFetch = () => {
  const fetchData = async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
      })
      const data = await response.json()
      return { 
        success: data.success, 
        data: data.data || data, 
        error: data.error, 
        count: data.count, 
        total: data.total,
        status: response.status,
        statusText: response.statusText
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
  
  return { fetchData }
}

// Notification helper
export const useNotification = () => {
  const [notification, setNotification] = useState(null)

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }
  
  return [notification, showNotification]
}

export { API_BASE_URL }

