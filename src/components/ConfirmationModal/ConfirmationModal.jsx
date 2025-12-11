import { useEffect } from 'react'
import './ConfirmationModal.css'
import { AlertTriangle } from 'lucide-react'

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger', onCancel }) {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onClose()
    }
  }

  return (
    <div className="confirmation-modal-overlay" onClick={handleCancel}>
      <div className="confirmation-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-modal-header">
          <div className="confirmation-modal-icon">
            <AlertTriangle size={24} className={`icon-${variant}`} />
          </div>
          <h2>{title || 'Confirm Action'}</h2>
        </div>
        <div className="confirmation-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirmation-modal-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn btn-${variant === 'danger' ? 'danger' : 'primary'}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal

