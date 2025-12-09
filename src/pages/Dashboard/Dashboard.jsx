import { useState, useEffect } from 'react'
import { useApiFetch, useNotification } from '../../lib/apiHelpers'
import './Dashboard.css'

function Dashboard() {
  const { fetchData } = useApiFetch()
  const [notification, showNotification] = useNotification()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    users: { total: 0, buyers: { total: 0, active: 0, pending: 0 }, brokers: 0, suppliers: 0 },
    projects: { total: 0 },
    properties: { total: 0 },
    products: { total: 0, lowStock: 0 },
    orders: { total: 0, byStatus: {}, byPaymentStatus: {} },
    revenue: { total: 0, pending: 0, received: 0 },
    support: { totalTickets: 0, byStatus: {} },
    notifications: { total: 0 },
    documents: { total: 0 }
  })

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const result = await fetchData('/dashboard/stats')
      if (result.success && result.data) {
        setStats(result.data)
      } else {
        showNotification(result.error || 'Failed to load dashboard stats', 'error')
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      showNotification('Failed to load dashboard stats', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`
    }
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const dashboardStats = [
    {
      title: 'Total Properties',
      value: stats.properties?.total?.toLocaleString() || '0',
      icon: '🏢',
      color: 'blue',
      change: `Total properties`
    },
    {
      title: 'Active Users',
      value: stats.users?.buyers?.active?.toLocaleString() || '0',
      icon: '👥',
      color: 'teal',
      change: `${stats.users?.total || 0} total users`
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.revenue?.received || 0),
      icon: '💰',
      color: 'green',
      change: `${formatCurrency(stats.revenue?.pending || 0)} pending`
    },
    {
      title: 'Pending Payments',
      value: formatCurrency(stats.revenue?.pending || 0),
      icon: '⏳',
      color: 'orange',
      change: `${stats.orders?.byPaymentStatus?.pending?.count || 0} orders`
    }
  ]

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard Overview</h1>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading dashboard...</div>
      ) : (
        <>
          <div className="stats-grid">
            {dashboardStats.map((stat, index) => (
              <div key={index} className={`stat-card stat-${stat.color}`}>
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-content">
                  <h3 className="stat-value">{stat.value}</h3>
                  <p className="stat-title">{stat.title}</p>
                  <span className="stat-change">{stat.change}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-grid">
            <div className="card recent-activities">
              <h2>Overview Statistics</h2>
              <div className="activities-list">
                <div className="activity-item">
                  <div className="activity-avatar">👥</div>
                  <div className="activity-details">
                    <p className="activity-user">Users</p>
                    <p className="activity-action">
                      Total: {stats.users?.total || 0} | 
                      Buyers: {stats.users?.buyers?.total || 0} | 
                      Brokers: {stats.users?.brokers || 0} | 
                      Suppliers: {stats.users?.suppliers || 0}
                    </p>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-avatar">📦</div>
                  <div className="activity-details">
                    <p className="activity-user">Products</p>
                    <p className="activity-action">
                      Total: {stats.products?.total || 0} | 
                      Low Stock: {stats.products?.lowStock || 0}
                    </p>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-avatar">🛒</div>
                  <div className="activity-details">
                    <p className="activity-user">Orders</p>
                    <p className="activity-action">
                      Total: {stats.orders?.total || 0} | 
                      Pending: {stats.orders?.byPaymentStatus?.pending?.count || 0}
                    </p>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-avatar">🎫</div>
                  <div className="activity-details">
                    <p className="activity-user">Support Tickets</p>
                    <p className="activity-action">
                      Total: {stats.support?.totalTickets || 0} | 
                      Pending: {stats.support?.byStatus?.pending || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card construction-status">
              <h2>Projects & Properties</h2>
              <div className="progress-item">
                <div className="progress-header">
                  <span>Total Projects</span>
                  <span className="progress-percent">{stats.projects?.total || 0}</span>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-header">
                  <span>Total Properties</span>
                  <span className="progress-percent">{stats.properties?.total || 0}</span>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-header">
                  <span>Documents</span>
                  <span className="progress-percent">{stats.documents?.total || 0}</span>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-header">
                  <span>Notifications</span>
                  <span className="progress-percent">{stats.notifications?.total || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default Dashboard

