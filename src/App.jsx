import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import BuyerManagement from './pages/BuyerManagement/BuyerManagement'
import BrokerManagement from './pages/BrokerManagement/BrokerManagement'
import SupplierManagement from './pages/SupplierManagement/SupplierManagement'
import AllUsers from './pages/AllUsers/AllUsers'
import PropertyManagement from './pages/PropertyManagement/PropertyManagement'
import ProductManagement from './pages/ProductManagement/ProductManagement'
import OrderManagement from './pages/OrderManagement/OrderManagement'
import Documents from './pages/Documents/Documents'
import Support from './pages/Support/Support'
import ProjectManagement from './pages/ProjectManagement/ProjectManagement'
import NotificationManagement from './pages/NotificationManagement/NotificationManagement'
import MarketingManagement from './pages/MarketingManagement/MarketingManagement'
import AdminProfile from './pages/AdminProfile/AdminProfile'

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
          // Verify user has allowed role
          const allowedRoles = ['admin', 'buyer', 'broker', 'supplier']
          if (allowedRoles.includes(user.role)) {
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
          <Route index element={
            <ProtectedRoute requiredPermission="dashboard">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="users">
            <Route index element={
              <ProtectedRoute requiredPermission="users">
                <AllUsers />
              </ProtectedRoute>
            } />
            <Route path="buyers" element={
              <ProtectedRoute requiredPermission="buyers">
                <BuyerManagement />
              </ProtectedRoute>
            } />
            <Route path="brokers" element={
              <ProtectedRoute requiredPermission="brokers">
                <BrokerManagement />
              </ProtectedRoute>
            } />
            <Route path="suppliers" element={
              <ProtectedRoute requiredPermission="suppliers">
                <SupplierManagement />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="projects">
            <Route index element={
              <ProtectedRoute requiredPermission="project-management">
                <ProjectManagement />
              </ProtectedRoute>
            } />
            <Route path="properties" element={
              <ProtectedRoute requiredPermission="property-management">
                <PropertyManagement />
              </ProtectedRoute>
            } />
            <Route path="marketing" element={
              <ProtectedRoute requiredPermission="marketing">
                <MarketingManagement />
              </ProtectedRoute>
            } />
            <Route path="documents" element={
              <ProtectedRoute requiredPermission="documents">
                <Documents />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="product" element={
            <ProtectedRoute requiredPermission="product-management">
              <ProductManagement />
            </ProtectedRoute>
          } />
          <Route path="order" element={
            <ProtectedRoute requiredPermission="order-management">
              <OrderManagement />
            </ProtectedRoute>
          } />
          <Route path="support" element={
            <ProtectedRoute requiredPermission="support">
              <Support />
            </ProtectedRoute>
          } />
          <Route path="notifications" element={
            <ProtectedRoute requiredPermission="notifications">
              <NotificationManagement />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute requiredPermission="profile">
              <AdminProfile />
            </ProtectedRoute>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

