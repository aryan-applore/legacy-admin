import { useState } from 'react'

export const useConfirmation = () => {
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger'
  })

  const confirm = (options) => {
    return new Promise((resolve, reject) => {
      setConfirmation({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        onConfirm: () => {
          resolve(true)
          setConfirmation(prev => ({ ...prev, isOpen: false }))
        },
        onCancel: () => {
          reject(false)
          setConfirmation(prev => ({ ...prev, isOpen: false }))
        },
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'danger'
      })
    })
  }

  const close = () => {
    setConfirmation(prev => {
      if (prev.onCancel) {
        prev.onCancel()
      }
      return {
        ...prev,
        isOpen: false,
        onConfirm: null,
        onCancel: null
      }
    })
  }

  const handleConfirm = () => {
    if (confirmation.onConfirm) {
      confirmation.onConfirm()
    }
  }

  const handleCancel = () => {
    if (confirmation.onCancel) {
      confirmation.onCancel()
    } else {
      close()
    }
  }

  return {
    confirmation,
    confirm,
    close,
    handleConfirm,
    handleCancel
  }
}

