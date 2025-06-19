import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Search, 
  Filter,
  Star,
  Navigation
} from 'lucide-react'
import { getRoutes, getFavoriteRoutes, addToFavorites, removeFromFavorites } from '../services/api'

const RoutesList = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: routesResponse, isLoading: routesLoading } = useQuery(
    'routes',
    getRoutes,
    {
      retry: 1,
      onError: (error) => {
        console.error('Error fetching routes:', error)
      }
    }
  )

  const { data: favoriteRoutes, isLoading: favoritesLoading } = useQuery(
    'favoriteRoutes',
    getFavoriteRoutes,
    {
      retry: 1,
      onError: (error) => {
        console.error('Error fetching favorite routes:', error)
      }
    }
  )

  // Ensure routes is always an array
  const routes = Array.isArray(routesResponse?.data) ? routesResponse.data : 
                 Array.isArray(routesResponse) ? routesResponse : 
                 // Fallback mock data for development
                 [
                   {
                     _id: '1',
                     name: 'Central to Airport',
                     description: 'Express route from Central Station to Airport Terminal',
                     estimatedDuration: 45,
                     fare: 2.50,
                     status: 'active',
                     stops: [
                       { _id: 's1', name: 'Central Station', address: 'Central Station, Downtown' },
                       { _id: 's2', name: 'Connaught Place', address: 'Connaught Place, New Delhi' },
                       { _id: 's3', name: 'Airport Terminal', address: 'Indira Gandhi International Airport' }
                     ],
                     schedule: {
                       firstBus: '06:00',
                       lastBus: '23:00',
                       frequency: 15
                     }
                   },
                   {
                     _id: '2',
                     name: 'Downtown Loop',
                     description: 'Circular route covering major downtown areas',
                     estimatedDuration: 60,
                     fare: 1.75,
                     status: 'active',
                     stops: [
                       { _id: 's4', name: 'City Center', address: 'City Center Plaza' },
                       { _id: 's5', name: 'Shopping District', address: 'Main Shopping Area' },
                       { _id: 's6', name: 'Business Park', address: 'Corporate Business Park' },
                       { _id: 's7', name: 'Residential Area', address: 'Downtown Residential' }
                     ],
                     schedule: {
                       firstBus: '05:30',
                       lastBus: '22:30',
                       frequency: 20
                     }
                   },
                   {
                     _id: '3',
                     name: 'University Express',
                     description: 'Direct route to University Campus',
                     estimatedDuration: 30,
                     fare: 1.50,
                     status: 'active',
                     stops: [
                       { _id: 's8', name: 'Student Center', address: 'University Student Center' },
                       { _id: 's9', name: 'Campus Main', address: 'University Main Campus' }
                     ],
                     schedule: {
                       firstBus: '07:00',
                       lastBus: '21:00',
                       frequency: 10
                     }
                   }
                 ]

  // Ensure favoriteRoutes is always an array
  const favorites = Array.isArray(favoriteRoutes?.data) ? favoriteRoutes.data :
                   Array.isArray(favoriteRoutes) ? favoriteRoutes : []

  const addToFavoritesMutation = useMutation(addToFavorites, {
    onSuccess: () => {
      queryClient.invalidateQueries('favoriteRoutes')
    }
  })

  const removeFromFavoritesMutation = useMutation(removeFromFavorites, {
    onSuccess: () => {
      queryClient.invalidateQueries('favoriteRoutes')
    }
  })

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || route.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const sortedRoutes = [...filteredRoutes].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'duration':
        return a.estimatedDuration - b.estimatedDuration
      case 'fare':
        return a.fare - b.fare
      default:
        return 0
    }
  })

  const isFavorite = (routeId) => {
    return favorites.some(fav => fav._id === routeId) || false
  }

  const handleToggleFavorite = (routeId) => {
    if (isFavorite(routeId)) {
      removeFromFavoritesMutation.mutate(routeId)
    } else {
      addToFavoritesMutation.mutate(routeId)
    }
  }

  const handleTrackBus = (routeId) => {
    // For now, we'll use a mock bus ID since we don't have real bus data
    // In a real implementation, you would get the bus ID associated with this route
    const mockBusId = `bus-${routeId}`
    navigate(`/tracking/${mockBusId}`)
  }

  const handleViewDetails = (route) => {
    setSelectedRoute(route)
    setShowDetailsModal(true)
  }

  const handleCloseModal = () => {
    setShowDetailsModal(false)
    setSelectedRoute(null)
  }

  if (routesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Routes</h1>
        <p className="text-gray-600">Explore all available bus routes and save your favorites</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="name">Sort by Name</option>
            <option value="duration">Sort by Duration</option>
            <option value="fare">Sort by Fare</option>
          </select>

          {/* Results Count */}
          <div className="flex items-center justify-end text-sm text-gray-600">
            {sortedRoutes.length} route{sortedRoutes.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedRoutes.map((route) => (
          <div key={route._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Route Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{route.name}</h3>
                  <p className="text-sm text-gray-600">{route.description}</p>
                </div>
                <button
                  onClick={() => handleToggleFavorite(route._id)}
                  className={`p-2 rounded-full transition-colors ${
                    isFavorite(route._id)
                      ? 'text-yellow-500 hover:text-yellow-600'
                      : 'text-gray-400 hover:text-yellow-500'
                  }`}
                >
                  <Star className={`h-5 w-5 ${isFavorite(route._id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Route Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-medium text-gray-900">{route.estimatedDuration} min</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Fare</p>
                    <p className="text-sm font-medium text-gray-900">${route.fare}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Stops</p>
                    <p className="text-sm font-medium text-gray-900">{route.stops?.length || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Navigation className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      route.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {route.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Route Stops Preview */}
              {route.stops && route.stops.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Route Stops</h4>
                  <div className="space-y-1">
                    {route.stops.slice(0, 3).map((stop, index) => (
                      <div key={stop._id} className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          index === 0 ? 'bg-green-500' : 
                          index === route.stops.length - 1 ? 'bg-red-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-xs text-gray-600">{stop.name}</span>
                      </div>
                    ))}
                    {route.stops.length > 3 && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-500">
                          +{route.stops.length - 3} more stops
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Route Schedule */}
              {route.schedule && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Schedule</h4>
                  <div className="text-xs text-gray-600">
                    <p>First: {route.schedule.firstBus}</p>
                    <p>Last: {route.schedule.lastBus}</p>
                    <p>Frequency: {route.schedule.frequency} min</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleViewDetails(route)}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
                >
                  View Details
                </button>
                <button 
                  onClick={() => handleTrackBus(route._id)}
                  className="flex-1 border border-primary-600 text-primary-600 py-2 px-4 rounded-md hover:bg-primary-50 transition-colors"
                >
                  Track Bus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sortedRoutes.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
          <p className="text-gray-500">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'No routes are currently available'
            }
          </p>
        </div>
      )}

      {/* Route Details Modal */}
      {showDetailsModal && selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedRoute.name}</h2>
                  <p className="text-gray-600 mt-1">{selectedRoute.description}</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Route Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Clock className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedRoute.estimatedDuration} min</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Fare</p>
                  <p className="text-lg font-semibold text-gray-900">${selectedRoute.fare}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <MapPin className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Stops</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedRoute.stops?.length || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Navigation className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedRoute.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedRoute.status}
                  </span>
                </div>
              </div>

              {/* Route Schedule */}
              {selectedRoute.schedule && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Schedule Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">First Bus</p>
                        <p className="font-medium text-gray-900">{selectedRoute.schedule.firstBus}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Last Bus</p>
                        <p className="font-medium text-gray-900">{selectedRoute.schedule.lastBus}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Frequency</p>
                        <p className="font-medium text-gray-900">{selectedRoute.schedule.frequency} min</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Route Stops */}
              {selectedRoute.stops && selectedRoute.stops.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Route Stops</h3>
                  <div className="space-y-2">
                    {selectedRoute.stops.map((stop, index) => (
                      <div key={stop._id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          index === 0 ? 'bg-green-100' : 
                          index === selectedRoute.stops.length - 1 ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          <span className={`text-sm font-medium ${
                            index === 0 ? 'text-green-600' : 
                            index === selectedRoute.stops.length - 1 ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{stop.name}</p>
                          {stop.address && (
                            <p className="text-sm text-gray-600">{stop.address}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    handleCloseModal()
                    handleTrackBus(selectedRoute._id)
                  }}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
                >
                  Track Bus
                </button>
                <button
                  onClick={() => handleToggleFavorite(selectedRoute._id)}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                    isFavorite(selectedRoute._id)
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'border border-yellow-600 text-yellow-600 hover:bg-yellow-50'
                  }`}
                >
                  {isFavorite(selectedRoute._id) ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoutesList 