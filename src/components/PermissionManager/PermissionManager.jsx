import { useState, useEffect } from 'react'
import { X, Shield, Check } from 'lucide-react'
import './PermissionManager.css'
import { API_BASE_URL } from '../../lib/apiHelpers'

function PermissionManager({ user, onClose, onUpdate }) {
  const [availablePermissions, setAvailablePermissions] = useState([])
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('adminToken')

      // Fetch available permissions
      const availableResponse = await fetch(`${API_BASE_URL}/permissions/available`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      })
      const availableData = await availableResponse.json()

      if (availableData.success) {
        setAvailablePermissions(availableData.data)
      }

      // Fetch current user permissions
      const userResponse = await fetch(`${API_BASE_URL}/permissions/${user.type}/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      })
      const userData = await userResponse.json()

      if (userData.success) {
        setSelectedPermissions(userData.data.permissions || [])
      }
    } catch (err) {
      console.error('Error fetching permissions:', err)
      setError('Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (permissionId) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(p => p !== permissionId)
      } else {
        return [...prev, permissionId]
      }
    })
  }

  const selectAll = () => {
    setSelectedPermissions(availablePermissions.map(p => p.id))
  }

  const deselectAll = () => {
    setSelectedPermissions([])
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      const token = localStorage.getItem('adminToken')

      const response = await fetch(`${API_BASE_URL}/permissions/${user.type}/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissions: selectedPermissions })
      })

      const data = await response.json()

      if (data.success) {
        onUpdate && onUpdate(data.data)
        onClose()
      } else {
        setError(data.message || 'Failed to update permissions')
      }
    } catch (err) {
      console.error('Error updating permissions:', err)
      setError('Failed to update permissions')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="permission-modal-overlay">
      <div className="permission-modal">
        <div className="permission-modal-header">
          <div className="permission-modal-title">
            <Shield size={24} />
            <div>
              <h2>Manage Permissions</h2>
              <p>{user.name} - {user.type.toUpperCase()}</p>
            </div>
          </div>
          <button className="permission-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="permission-modal-body">
          {loading ? (
            <div className="permission-loading">Loading permissions...</div>
          ) : error ? (
            <div className="permission-error">{error}</div>
          ) : (
            <>
              <div className="permission-actions">
                <button className="permission-action-btn" onClick={selectAll}>
                  Select All
                </button>
                <button className="permission-action-btn" onClick={deselectAll}>
                  Deselect All
                </button>
                <div className="permission-count">
                  {selectedPermissions.length} of {availablePermissions.length} selected
                </div>
              </div>

              <div className="permission-list">
                {availablePermissions.map(permission => (
                  <div
                    key={permission.id}
                    className={`permission-item ${selectedPermissions.includes(permission.id) ? 'selected' : ''}`}
                    onClick={() => togglePermission(permission.id)}
                  >
                    <div className="permission-checkbox">
                      {selectedPermissions.includes(permission.id) && <Check size={16} />}
                    </div>
                    <div className="permission-info">
                      <h4>{permission.name}</h4>
                      <p>{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="permission-modal-footer">
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PermissionManager

