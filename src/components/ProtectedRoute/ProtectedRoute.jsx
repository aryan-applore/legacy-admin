import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, requiredPermission }) {
  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem('adminUser')
      return userStr ? JSON.parse(userStr) : null
    } catch (err) {
      console.error('Error parsing user:', err)
      return null
    }
  }

  const currentUser = getCurrentUser()

  // Admins have access to everything
  if (currentUser?.role === 'admin') {
    return children
  }

  // Check if user has the required permission
  const userPermissions = currentUser?.permissions || []
  
  if (!requiredPermission || userPermissions.includes(requiredPermission)) {
    return children
  }

  // If user doesn't have permission, redirect to first available page
  if (userPermissions.length > 0) {
    const permissionToPathMap = {
      'dashboard': '/',
      'users': '/users',
      'buyers': '/users/buyers',
      'brokers': '/users/brokers',
      'suppliers': '/users/suppliers',
      'project-management': '/projects',
      'property-management': '/projects/properties',
      'marketing': '/projects/marketing',
      'documents': '/projects/documents',
      'product-management': '/product',
      'order-management': '/order',
      'support': '/support',
      'notifications': '/notifications',
      'profile': '/profile'
    }
    
    // Find first available page user has access to
    const firstAvailablePath = permissionToPathMap[userPermissions[0]] || '/'
    return <Navigate to={firstAvailablePath} replace />
  }

  // If user has no permissions at all, show access denied or redirect to dashboard
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
        Please contact your administrator to request access.
      </p>
    </div>
  )
}

export default ProtectedRoute

