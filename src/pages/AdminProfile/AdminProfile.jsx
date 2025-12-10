import { useState, useEffect } from 'react'
import { useApiFetch, useNotification } from '../../lib/apiHelpers'
import './AdminProfile.css'

function AdminProfile() {
  const { fetchData } = useApiFetch()
  const [notification, showNotification] = useNotification()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const result = await fetchData('/profile')
      if (result.success) {
        setProfile(result.data)
        setFormData({
          name: result.data.name || '',
          email: result.data.email || ''
        })
      } else {
        showNotification(result.error || 'Failed to load profile', 'error')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      showNotification('Failed to load profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      showNotification('Please fill all required fields', 'error')
      return
    }

    try {
      const result = await fetchData('/profile', {
        method: 'PUT',
        body: JSON.stringify(formData)
      })
      if (result.success) {
        showNotification('Profile updated successfully', 'success')
        fetchProfile()
      } else {
        showNotification(result.error || 'Failed to update profile', 'error')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      showNotification('Failed to update profile', 'error')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showNotification('Please fill all required fields', 'error')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('New passwords do not match', 'error')
      return
    }

    if (passwordData.newPassword.length < 6) {
      showNotification('New password must be at least 6 characters long', 'error')
      return
    }

    try {
      const result = await fetchData('/profile/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })
      if (result.success) {
        showNotification('Password changed successfully', 'success')
        setShowPasswordModal(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        showNotification(result.error || 'Failed to change password', 'error')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      showNotification('Failed to change password', 'error')
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>Loading profile...</div>
    )
  }

  return (
    <div className="admin-profile-page">
      <div className="page-header">
        <div>
          <h1 className="page-title-white">Admin Profile</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>
      </div>

      <div className="card profile-section">
        <h2>Profile Information</h2>
        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <input
              type="text"
              value={profile?.role || 'admin'}
              disabled
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </div>
          {profile?.createdAt && (
            <div className="form-group">
              <label>Member Since</label>
              <input
                type="text"
                value={new Date(profile.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
                disabled
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </div>
          )}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Update Profile
            </button>
          </div>
        </form>
      </div>

      <div className="card password-section">
        <h2>Change Password</h2>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          Click the button below to change your password
        </p>
        <button 
          className="btn btn-outline"
          onClick={() => setShowPasswordModal(true)}
        >
          Change Password
        </button>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <form onSubmit={handleChangePassword} className="modal-body">
              <div className="form-group">
                <label>Current Password *</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Must be at least 6 characters long
                </small>
              </div>
              <div className="form-group">
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default AdminProfile

