import { useState } from 'react'

export const useConfirmation = () => {
  const [confirmation, setConfirmation] = useState({
    show: false,
    title: '',
    message: '',
    variant: 'default',
    onConfirm: null,
    onCancel: null
  })

  const confirm = (options) => {
    return new Promise((resolve) => {
      setConfirmation({
        show: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        variant: options.variant || 'default',
        onConfirm: () => {
          resolve(true)
          setConfirmation(prev => ({ ...prev, show: false, onConfirm: null, onCancel: null }))
        },
        onCancel: () => {
          resolve(false)
          setConfirmation(prev => ({ ...prev, show: false, onConfirm: null, onCancel: null }))
        }
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
        show: false,
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

