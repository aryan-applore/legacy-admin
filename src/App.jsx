import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import UserManagement from './pages/UserManagement/UserManagement'
import BrokerManagement from './pages/BrokerManagement/BrokerManagement'
import SupplierManagement from './pages/SupplierManagement/SupplierManagement'
import AllUsers from './pages/AllUsers/AllUsers'
import PropertyManagement from './pages/PropertyManagement/PropertyManagement'
import ProductManagement from './pages/ProductManagement/ProductManagement'
import OrderManagement from './pages/OrderManagement/OrderManagement'
import Documents from './pages/Documents/Documents'
import Support from './pages/Support/Support'
import AppApiTest from './pages/AppApiTest/AppApiTest'
import SupportApiTest from './pages/SupportApiTest/SupportApiTest'
import ProjectManagement from './pages/ProjectManagement/ProjectManagement'

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
          <Route path="user-management" element={
            <ProtectedRoute requiredPermission="user-management">
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="all-users" element={
            <ProtectedRoute requiredPermission="all-users">
              <AllUsers />
            </ProtectedRoute>
          } />
          <Route path="property-management" element={
            <ProtectedRoute requiredPermission="property-management">
              <PropertyManagement />
            </ProtectedRoute>
          } />
          <Route path="broker-management" element={
            <ProtectedRoute requiredPermission="broker-management">
              <BrokerManagement />
            </ProtectedRoute>
          } />
          <Route path="supplier-management" element={
            <ProtectedRoute requiredPermission="supplier-management">
              <SupplierManagement />
            </ProtectedRoute>
          } />
          <Route path="product-management" element={
            <ProtectedRoute requiredPermission="product-management">
              <ProductManagement />
            </ProtectedRoute>
          } />
          <Route path="order-management" element={
            <ProtectedRoute requiredPermission="order-management">
              <OrderManagement />
            </ProtectedRoute>
          } />
          <Route path="documents" element={
            <ProtectedRoute requiredPermission="documents">
              <Documents />
            </ProtectedRoute>
          } />
          <Route path="support" element={
            <ProtectedRoute requiredPermission="support">
              <Support />
            </ProtectedRoute>
          } />
          <Route path="project-management" element={
            <ProtectedRoute requiredPermission="project-management">
              <ProjectManagement />
            </ProtectedRoute>
          } />
          <Route path="app-api-test" element={
            <ProtectedRoute requiredPermission="app-api-test">
              <AppApiTest />
            </ProtectedRoute>
          } />
          <Route path="support-api-test" element={
            <ProtectedRoute requiredPermission="support-api-test">
              <SupportApiTest />
            </ProtectedRoute>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

