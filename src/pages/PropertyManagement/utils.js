// Utility functions for Property Management

export const formatLocation = (location) => {
  if (!location) return 'N/A'
  if (typeof location === 'string') return location
  if (location.city && location.state) {
    return `${location.city}, ${location.state}`
  }
  if (location.city) return location.city
  if (location.address) return location.address
  return 'N/A'
}

export const getStatus = (property) => {
  return property.status?.toLowerCase() || 'active'
}

export const getProgress = (property) => {
  if (property.progress) {
    return {
      percentage: property.progress.percentage || 0,
      stage: property.progress.stage || ''
    }
  }
  return {
    percentage: property.progressPercentage || 0,
    stage: property.currentStage || ''
  }
}

export const getDisplayStage = (stage) => {
  if (!stage || stage.trim() === '') return 'None'
  const stageLower = stage.toLowerCase()
  if (stageLower.includes('foundation')) {
    return 'Foundation'
  } else if (stageLower.includes('structure')) {
    return 'Structure'
  } else if (stageLower.includes('finishing')) {
    return 'Finishing'
  }
  return stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase()
}

export const getStageColorClass = (stage) => {
  const stageLower = stage.toLowerCase()
  if (stageLower.includes('foundation')) return 'status-error'
  if (stageLower.includes('structure')) return 'status-info'
  if (stageLower.includes('finishing')) return 'status-success'
  return 'status-info'
}

export const getProgressColor = (percentage) => {
  if (percentage >= 75) return 'hsl(142 76% 36%)'
  if (percentage >= 50) return 'hsl(38 92% 50%)'
  if (percentage >= 25) return 'hsl(25 95% 53%)'
  return 'hsl(0 84% 60%)'
}

export const getInstalmentsProgress = (property) => {
  const instalments = property.instalments || []
  if (instalments.length === 0) return { percentage: 0, paid: 0, total: 0 }
  
  const totalAmount = instalments.reduce((sum, inst) => sum + (inst.amount || 0), 0)
  const paidAmount = instalments
    .filter(inst => inst.status === 'paid')
    .reduce((sum, inst) => sum + (inst.amount || 0), 0)
  
  const percentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0
  return { percentage, paid: paidAmount, total: totalAmount }
}

export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A'
  return `₹${amount.toLocaleString('en-IN')}`
}

export const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Get buyer/broker from array (API returns arrays)
export const getPerson = (property, type = 'buyer') => {
  const arrayKey = type === 'buyer' ? 'buyers' : 'brokers'
  const array = property[arrayKey]
  return (array && array.length > 0) ? array[0] : null
}

