import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
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
import AdminManagement from './pages/AdminManagement/AdminManagement'

// Inner app component that uses auth context
function AppRoutes() {
  const { user, loading } = useAuth()

  // Show loading state while checking authentication
  if (loading) {
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

  // Show protected routes if authenticated
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="users">
            <Route index element={
              <ProtectedRoute requiredPermission={{ resource: 'users', action: 'read' }}>
                <AllUsers />
              </ProtectedRoute>
            } />
            <Route path="buyers" element={
              <ProtectedRoute requiredPermission={{ resource: 'buyers', action: 'read' }}>
                <BuyerManagement />
              </ProtectedRoute>
            } />
            <Route path="brokers" element={
              <ProtectedRoute requiredPermission={{ resource: 'brokers', action: 'read' }}>
                <BrokerManagement />
              </ProtectedRoute>
            } />
            <Route path="suppliers" element={
              <ProtectedRoute requiredPermission={{ resource: 'suppliers', action: 'read' }}>
                <SupplierManagement />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="projects">
            <Route index element={
              <ProtectedRoute requiredPermission={{ resource: 'projects', action: 'read' }}>
                <ProjectManagement />
              </ProtectedRoute>
            } />
            <Route path="properties" element={
              <ProtectedRoute requiredPermission={{ resource: 'properties', action: 'read' }}>
                <PropertyManagement />
              </ProtectedRoute>
            } />
            <Route path="marketing" element={
              <ProtectedRoute requiredPermission={{ resource: 'marketing', action: 'read' }}>
                <MarketingManagement />
              </ProtectedRoute>
            } />
            <Route path="documents" element={
              <ProtectedRoute requiredPermission={{ resource: 'documents', action: 'read' }}>
                <Documents />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="product" element={
            <ProtectedRoute requiredPermission={{ resource: 'products', action: 'read' }}>
              <ProductManagement />
            </ProtectedRoute>
          } />
          <Route path="order" element={
            <ProtectedRoute requiredPermission={{ resource: 'supplier-orders', action: 'read' }}>
              <OrderManagement />
            </ProtectedRoute>
          } />
          <Route path="support" element={
            <ProtectedRoute requiredPermission={{ resource: 'support', action: 'read' }}>
              <Support />
            </ProtectedRoute>
          } />
          <Route path="notifications" element={
            <ProtectedRoute requiredPermission={{ resource: 'notifications', action: 'read' }}>
              <NotificationManagement />
            </ProtectedRoute>
          } />
          <Route path="admins" element={
            <ProtectedRoute superadminOnly={true}>
              <AdminManagement />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <AdminProfile />
            </ProtectedRoute>
          } />
        </Route>
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  )
}

// Main App component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App

