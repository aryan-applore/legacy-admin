import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import Header from '../Header/Header'
import './Layout.css'

function Layout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="main-content">
        <Header onMenuClick={toggleSidebar} onLogout={onLogout} />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
      {sidebarOpen && <div className="overlay" onClick={closeSidebar}></div>}
    </div>
  )
}

export default Layout

