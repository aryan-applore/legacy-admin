import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

/**
 * ProtectedRoute - Protects routes based on permissions
 * 
 * @param {React.ReactNode} children - The component to render if user has permission
 * @param {object} requiredPermission - Object with resource and action
 * @param {string} requiredPermission.resource - The resource name (e.g., 'buyers', 'projects')
 * @param {string} requiredPermission.action - The action name (e.g., 'read', 'create', 'update', 'delete')
 * @param {boolean} superadminOnly - If true, only superadmin can access
 */
function ProtectedRoute({ children, requiredPermission, superadminOnly = false }) {
  const { user, loading, hasPermission, isSuperAdmin, hasAnyPermission } = useAuth()

  // Show loading state
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

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check superadmin only routes
  if (superadminOnly && !isSuperAdmin()) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        padding: '40px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Access Denied</h2>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          This page is only accessible to superadmin users.
        </p>
      </div>
    )
  }

  // If no permission required, allow access
  if (!requiredPermission) {
    return children
  }

  // Check if user has the required permission
  const { resource, action } = requiredPermission
  
  if (hasPermission(resource, action)) {
    return children
  }

  // If user doesn't have permission, show access denied
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh',
      padding: '40px',
      textAlign: 'center'
    }}>
      <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Access Denied</h2>
      <p style={{ color: '#6b7280', fontSize: '16px' }}>
        You don't have permission to access this page.
      </p>
      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
        Required: {resource}.{action}
      </p>
      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
        Please contact your administrator to request access.
      </p>
    </div>
  )
}

export default ProtectedRoute

