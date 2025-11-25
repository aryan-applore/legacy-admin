import { getProgressColor } from '../utils'

const PROGRESS_CIRCLE_SIZE = 48
const PROGRESS_STROKE_WIDTH = 4

export const ProgressCircle = ({ percentage }) => {
  const radius = (PROGRESS_CIRCLE_SIZE - PROGRESS_STROKE_WIDTH) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference
  const color = getProgressColor(percentage)
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      <div style={{ position: 'relative', width: PROGRESS_CIRCLE_SIZE, height: PROGRESS_CIRCLE_SIZE }}>
        <svg width={PROGRESS_CIRCLE_SIZE} height={PROGRESS_CIRCLE_SIZE} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={PROGRESS_CIRCLE_SIZE / 2}
            cy={PROGRESS_CIRCLE_SIZE / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={PROGRESS_STROKE_WIDTH}
          />
          <circle
            cx={PROGRESS_CIRCLE_SIZE / 2}
            cy={PROGRESS_CIRCLE_SIZE / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={PROGRESS_STROKE_WIDTH}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 4px ${color}60)`
            }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '11px',
          fontWeight: '700',
          color: 'hsl(var(--foreground))',
          lineHeight: '1'
        }}>
          {percentage}%
        </div>
      </div>
    </div>
  )
}

