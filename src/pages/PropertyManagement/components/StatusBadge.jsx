import { getStageColorClass } from '../utils'

export const StatusBadge = ({ status, type = 'status' }) => {
  const getStatusClass = () => {
    if (type === 'stage') {
      return getStageColorClass(status)
    }
    // For property status
    const statusLower = (status || '').toLowerCase()
    if (statusLower === 'active') return 'status-success'
    if (statusLower === 'completed') return 'status-info'
    return 'status-error'
  }
  
  return (
    status ? (
      <span className={`status-badge ${getStatusClass()}`}>
        {status}
      </span>
    ) : null
  )
}

