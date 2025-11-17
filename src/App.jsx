import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import UserManagement from './pages/UserManagement/UserManagement'
import BrokerManagement from './pages/BrokerManagement/BrokerManagement'
import SupplierManagement from './pages/SupplierManagement/SupplierManagement'
import PropertyManagement from './pages/PropertyManagement/PropertyManagement'
import Documents from './pages/Documents/Documents'
import Support from './pages/Support/Support'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('adminToken')
      const adminUser = localStorage.getItem('adminUser')
      
      if (token && adminUser) {
        try {
          const user = JSON.parse(adminUser)
          // Verify user has admin role
          if (user.role === 'admin') {
            setIsAuthenticated(true)
          } else {
            // Clear invalid auth
            localStorage.removeItem('adminToken')
            localStorage.removeItem('adminUser')
            setIsAuthenticated(false)
          }
        } catch (err) {
          console.error('Error parsing admin user:', err)
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminUser')
          setIsAuthenticated(false)
        }
      } else {
        setIsAuthenticated(false)
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const handleLogin = (token, user) => {
    localStorage.setItem('adminToken', token)
    localStorage.setItem('adminUser', JSON.stringify(user))
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setIsAuthenticated(false)
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1A2B3C 0%, #2A3F54 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  // Show protected routes if authenticated
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Layout onLogout={handleLogout} />}>
          <Route index element={<Dashboard />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="property-management" element={<PropertyManagement />} />
          <Route path="broker-management" element={<BrokerManagement />} />
          <Route path="supplier-management" element={<SupplierManagement />} />
          <Route path="documents" element={<Documents />} />
          <Route path="support" element={<Support />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

