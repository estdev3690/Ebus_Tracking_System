import { Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Header from './Header'

const Layout = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout 