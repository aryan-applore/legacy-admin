import { User, Handshake } from 'lucide-react'

const CELL_STYLES = {
  container: { minWidth: 0 },
  name: { 
    overflow: 'hidden', 
    textOverflow: 'ellipsis', 
    whiteSpace: 'nowrap',
    maxWidth: '140px'
  }
}

export const PersonCell = ({ person, type = 'buyer' }) => {
  const Icon = type === 'buyer' ? User : Handshake
  
  if (!person || !person.name) {
    return (
      <span className="no-assignment" style={{ fontStyle: 'italic', color: 'hsl(var(--muted-foreground))' }}>
        Not assigned
      </span>
    )
  }
  
  return (
    <div className="user-info-pm">
      <Icon size={16} style={{ marginRight: '6px', color: 'hsl(var(--primary))', flexShrink: 0 }} />
      <div style={CELL_STYLES.container}>
        <div className="user-name-pm" style={CELL_STYLES.name}>
          {person.name}
        </div>
      </div>
    </div>
  )
}

