import { useState, useEffect } from 'react'
import './PermissionAssignmentForm.css'

const RESOURCES = [
  { value: 'buyers', label: 'Buyers' },
  { value: 'brokers', label: 'Brokers' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'users', label: 'Users' },
  { value: 'projects', label: 'Projects' },
  { value: 'properties', label: 'Properties' },
  { value: 'products', label: 'Products' },
  { value: 'categories', label: 'Categories' },
  { value: 'supplier-orders', label: 'Supplier Orders' },
  { value: 'support', label: 'Support' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'documents', label: 'Documents' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'dashboard', label: 'Dashboard' }
]

const ACTIONS = [
  { value: 'create', label: 'Create' },
  { value: 'read', label: 'Read' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' }
]

export function PermissionAssignmentForm({ currentPermissions = [], onSubmit, onCancel }) {
  const [permissions, setPermissions] = useState([])

  useEffect(() => {
    // Initialize permissions from currentPermissions
    setPermissions(currentPermissions || [])
  }, [currentPermissions])

  const togglePermission = (resource, action) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.resource === resource)
      if (existing) {
        const updatedActions = existing.actions.includes(action)
          ? existing.actions.filter(a => a !== action)
          : [...existing.actions, action]
        
        if (updatedActions.length === 0) {
          // Remove resource if no actions
          return prev.filter(p => p.resource !== resource)
        }
        
        return prev.map(p => 
          p.resource === resource 
            ? { ...p, actions: updatedActions }
            : p
        )
      } else {
        // Add new resource with action
        return [...prev, { resource, actions: [action] }]
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(permissions)
  }

  const selectAllForResource = (resource) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.resource === resource)
      if (existing && existing.actions.length === ACTIONS.length) {
        // Deselect all
        return prev.filter(p => p.resource !== resource)
      } else {
        // Select all actions
        const allActions = ACTIONS.map(a => a.value)
        if (existing) {
          return prev.map(p => 
            p.resource === resource 
              ? { ...p, actions: allActions }
              : p
          )
        } else {
          return [...prev, { resource, actions: allActions }]
        }
      }
    })
  }

  const selectAllForAction = (action) => {
    setPermissions(prev => {
      const resources = RESOURCES.map(r => r.value)
      const updated = [...prev]
      
      resources.forEach(resource => {
        const existing = updated.find(p => p.resource === resource)
        if (existing) {
          if (!existing.actions.includes(action)) {
            existing.actions.push(action)
          }
        } else {
          updated.push({ resource, actions: [action] })
        }
      })
      
      return updated
    })
  }

  return (
    <form onSubmit={handleSubmit} className="permission-assignment-form">
      <div className="permission-matrix-container">
        <table className="permission-matrix">
          <thead>
            <tr>
              <th>Resource</th>
              {ACTIONS.map(action => (
                <th key={action.value}>
                  <button
                    type="button"
                    className="select-all-btn"
                    onClick={() => selectAllForAction(action.value)}
                    title={`Select all ${action.label}`}
                  >
                    {action.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RESOURCES.map(resource => {
              const permission = permissions.find(p => p.resource === resource.value)
              const actions = permission?.actions || []
              const allSelected = actions.length === ACTIONS.length
              
              return (
                <tr key={resource.value}>
                  <td>
                    <div className="resource-cell">
                      <span>{resource.label}</span>
                      <button
                        type="button"
                        className="select-all-resource-btn"
                        onClick={() => selectAllForResource(resource.value)}
                        title={allSelected ? 'Deselect all' : 'Select all'}
                      >
                        {allSelected ? '✓' : '○'}
                      </button>
                    </div>
                  </td>
                  {ACTIONS.map(action => (
                    <td key={action.value}>
                      <input
                        type="checkbox"
                        checked={actions.includes(action.value)}
                        onChange={() => togglePermission(resource.value, action.value)}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="permission-summary">
        <h4>Selected Permissions:</h4>
        {permissions.length === 0 ? (
          <p className="no-permissions">No permissions selected</p>
        ) : (
          <ul>
            {permissions.map(perm => (
              <li key={perm.resource}>
                <strong>{RESOURCES.find(r => r.value === perm.resource)?.label}</strong>: {perm.actions.join(', ')}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save Permissions
        </button>
      </div>
    </form>
  )
}

export default PermissionAssignmentForm

