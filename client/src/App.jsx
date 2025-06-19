import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BusSearch from './pages/BusSearch'
import BusTracking from './pages/BusTracking'
import RoutesList from './pages/RoutesList'
import AdminDashboard from './pages/AdminDashboard'
import DriverDashboard from './pages/DriverDashboard'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        
        {/* User routes */}
        <Route path="dashboard" element={
          <ProtectedRoute allowedRoles={['user']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="search" element={
          <ProtectedRoute allowedRoles={['user']}>
            <BusSearch />
          </ProtectedRoute>
        } />
        <Route path="tracking/:busId" element={
          <ProtectedRoute allowedRoles={['user']}>
            <BusTracking />
          </ProtectedRoute>
        } />
        <Route path="routes" element={
          <ProtectedRoute allowedRoles={['user']}>
            <RoutesList />
          </ProtectedRoute>
        } />
        
        {/* Admin routes */}
        <Route path="admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Driver routes */}
        <Route path="driver" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverDashboard />
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App 