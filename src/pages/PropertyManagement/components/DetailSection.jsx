export const DetailSection = ({ title, children, className = '' }) => (
  <div className={`details-section ${className}`} style={{ marginTop: '24px' }}>
    <h4>{title}</h4>
    {children}
  </div>
)

export const DetailGrid = ({ children }) => (
  <div className="details-grid">
    {children}
  </div>
)

export const DetailItem = ({ label, value, children }) => (
  <div className="detail-item">
    <label>{label}</label>
    {children || <p>{value || 'N/A'}</p>}
  </div>
)

export const PersonDetailCard = ({ person, type = 'buyer' }) => {
  if (!person || !person.name) {
    return (
      <div className="person-detail-empty">
        <p>No {type} assigned</p>
      </div>
    )
  }
  
  const fields = type === 'buyer' 
    ? ['name', 'email', 'phone']
    : ['name', 'company', 'email', 'phone']
  
  return (
    <div className="person-detail-card-modern">
      {fields.map(field => (
        <div key={field} className="person-detail-field">
          <div className="person-detail-field-label">
            {field.charAt(0).toUpperCase() + field.slice(1)}
          </div>
          <div className="person-detail-field-value">
            {person[field] || 'N/A'}
          </div>
        </div>
      ))}
    </div>
  )
}

