import { useAuth } from '../../contexts/AuthContext'

/**
 * ConditionalButton - Renders a button only if user has the required permission
 * 
 * @param {string} resource - The resource name (e.g., 'buyers', 'projects')
 * @param {string} action - The action name (e.g., 'create', 'update', 'delete', 'read')
 * @param {React.ReactNode} children - Button content
 * @param {function} onClick - Click handler
 * @param {object} props - Other button props
 */
export function ConditionalButton({ 
  resource, 
  action, 
  children, 
  onClick,
  disabled,
  className,
  ...props 
}) {
  const { hasPermission } = useAuth()

  if (!hasPermission(resource, action)) {
    return null // Don't render button if no permission
  }

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}

export default ConditionalButton

