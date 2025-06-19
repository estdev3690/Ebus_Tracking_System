import { useAuth } from '../contexts/AuthContext'
import { Bus, MapPin, Clock, Star, Search, Route } from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Search className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Search Bus</h3>
              <p className="text-sm text-gray-600">Find buses by location</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Track Bus</h3>
              <p className="text-sm text-gray-600">Real-time bus tracking</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Route className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">View Routes</h3>
              <p className="text-sm text-gray-600">All available routes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Bus #123 started trip on Route A</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Route B schedule updated</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">New bus added to fleet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 