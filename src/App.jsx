import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard/Dashboard'
import UserManagement from './pages/UserManagement/UserManagement'
import BrokerManagement from './pages/BrokerManagement/BrokerManagement'
import SupplierManagement from './pages/SupplierManagement/SupplierManagement'
import PropertyManagement from './pages/PropertyManagement/PropertyManagement'
import Documents from './pages/Documents/Documents'
import Support from './pages/Support/Support'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="property-management" element={<PropertyManagement />} />
          <Route path="broker-management" element={<BrokerManagement />} />
          <Route path="supplier-management" element={<SupplierManagement />} />
          <Route path="documents" element={<Documents />} />
          <Route path="support" element={<Support />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

