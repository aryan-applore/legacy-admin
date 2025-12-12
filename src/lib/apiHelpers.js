// DRY: Shared API helper functions
import { useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api'

// Reusable API fetch helper
export const useApiFetch = () => {
  const fetchData = async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('adminToken')
      const isFormData = options.body instanceof FormData
      
      const headers = {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      })
      
      const data = await response.json()
      
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return { 
          success: false, 
          error: data.error || 'Not authorized. Please login again.',
          status: 401
        }
      }
      
      // Handle 403 Forbidden - permission denied
      if (response.status === 403) {
        return { 
          success: false, 
          error: data.error || 'Permission denied',
          status: 403
        }
      }
      
      return { 
        success: data.success, 
        data: data.data || data, 
        error: data.error, 
        count: data.count, 
        total: data.total,
        meta: data.meta,
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

