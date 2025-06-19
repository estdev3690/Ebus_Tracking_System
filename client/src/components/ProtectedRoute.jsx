import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />
      case 'driver':
        return <Navigate to="/driver" replace />
      case 'user':
        return <Navigate to="/dashboard" replace />
      default:
        return <Navigate to="/login" replace />
    }
  }

  return children
}

export default ProtectedRoute 