import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  Menu,
  X,
  Home, 
  Search, 
  MapPin, 
  Route, 
  Users, 
  Bus, 
  BarChart3,
  Navigation
} from 'lucide-react'

const Header = () => {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const userNavItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/search', icon: Search, label: 'Search Bus' },
    { to: '/routes', icon: Route, label: 'Routes' },
  ]

  const adminNavItems = [
    { to: '/admin', icon: BarChart3, label: 'Dashboard' },
    { to: '/admin/drivers', icon: Users, label: 'Drivers' },
    { to: '/admin/buses', icon: Bus, label: 'Buses' },
    { to: '/admin/routes', icon: Route, label: 'Routes' },
    { to: '/admin/users', icon: Users, label: 'Users' },
  ]

  const driverNavItems = [
    { to: '/driver', icon: Home, label: 'Dashboard' },
    { to: '/driver/trip', icon: Navigation, label: 'Current Trip' },
    { to: '/driver/routes', icon: Route, label: 'My Routes' },
    { to: '/driver/history', icon: BarChart3, label: 'Trip History' },
  ]

  const getNavItems = () => {
    switch (user?.role) {
      case 'admin':
        return adminNavItems
      case 'driver':
        return driverNavItems
      default:
        return userNavItems
    }
  }

  const NavItems = () => (
    <>
      {getNavItems().map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={() => setShowMobileMenu(false)}
          className={({ isActive }) =>
            `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`
          }
        >
          <item.icon className="h-5 w-5 mr-2" />
          {item.label}
        </NavLink>
      ))}
    </>
  )

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {showMobileMenu ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <h1 className="text-xl font-semibold text-gray-900 ml-2 lg:ml-0">
              E-Bus Management System
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <NavItems />
          </nav>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <Bell className="h-5 w-5" />
            </button>
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-500"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                    <div className="text-gray-500">{user?.email}</div>
                    <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
                  </div>
                  
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                  
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <nav className="space-y-1">
              <NavItems />
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header 