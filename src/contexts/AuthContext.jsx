import { createContext, useContext, useState, useEffect } from 'react'
import { useApiFetch } from '../lib/apiHelpers'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('adminToken'))
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const userStr = localStorage.getItem('adminUser')
        const storedToken = localStorage.getItem('adminToken')
        
        if (storedToken && userStr) {
          const parsedUser = JSON.parse(userStr)
          setUser(parsedUser)
          setToken(storedToken)
        }
      } catch (error) {
        console.error('Error loading user from storage:', error)
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
      } finally {
        setLoading(false)
      }
    }
    
    loadUser()
  }, [])

  // Login function
  const login = async (email, password) => {
    setLoading(true)
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api'
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password 
        })
      })

      const data = await response.json()

      if (data.success && data.data?.token) {
        const account = data.data.account
        
        // Only allow admin and superadmin roles
        if (account.role !== 'admin' && account.role !== 'superadmin') {
          throw new Error('Access denied. Invalid account type.')
        }

        setToken(data.data.token)
        setUser(account)
        localStorage.setItem('adminToken', data.data.token)
        localStorage.setItem('adminUser', JSON.stringify(account))
        
        return { success: true, data: data.data, error: null }
      } else {
        throw new Error(data.error || 'Invalid email or password')
      }
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api'
      const storedToken = localStorage.getItem('adminToken')
      if (storedToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setToken(null)
      setUser(null)
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
    }
  }

  // Check if user is superadmin
  const isSuperAdmin = () => {
    return user?.role === 'superadmin'
  }

  // Check if user has permission for resource and action
  const hasPermission = (resource, action) => {
    if (!user) return false

    // Superadmin has all permissions
    if (user.role === 'superadmin' || user.permissions === 'all') {
      return true
    }

    // Check if user has permission for this resource
    const permission = user.permissions?.find(p => p.resource === resource)
    if (!permission) {
      return false
    }

    // Check if user has the specific action
    return permission.actions.includes(action)
  }

  // Get all resources user has access to
  const getAccessibleResources = () => {
    if (isSuperAdmin()) {
      return 'all'
    }
    return user?.permissions?.map(p => p.resource) || []
  }

  // Check if user can perform any action on a resource
  const hasAnyPermission = (resource) => {
    if (!user) return false
    if (user.role === 'superadmin' || user.permissions === 'all') {
      return true
    }
    return user.permissions?.some(p => p.resource === resource) || false
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    hasPermission,
    isSuperAdmin,
    getAccessibleResources,
    hasAnyPermission
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

