import { useState, useEffect } from 'react'
import { X, Shield, Check } from 'lucide-react'
import './PermissionManager.css'
import { useApiFetch } from '../../lib/apiHelpers'

function PermissionManager({ user, onClose, onUpdate }) {
  const [availablePermissions, setAvailablePermissions] = useState([])
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const { fetchData } = useApiFetch()

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch available permissions
      const availableRes = await fetchData('/permissions/available')
      if (availableRes.success) {
        setAvailablePermissions(availableRes.data)
      }

      // Fetch current user permissions
      const userRes = await fetchData(`/permissions/${user.type}/${user.id}`)
      if (userRes.success) {
        setSelectedPermissions(userRes.data.permissions || [])
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

      const result = await fetchData(`/permissions/${user.type}/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: selectedPermissions })
      })

      if (result.success) {
        onUpdate && onUpdate(result.data)
        onClose()
      } else {
        setError(result.error || 'Failed to update permissions')
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

