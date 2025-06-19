import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Users, 
  Play, 
  Square, 
  AlertTriangle,
  CheckCircle,
  Route
} from 'lucide-react'
import { 
  getDriverCurrentTrip, 
  getDriverProfile, 
  updateLocation, 
  startTrip, 
  endTrip 
} from '../services/api'

const DriverDashboard = () => {
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 })
  const [isTracking, setIsTracking] = useState(false)
  const queryClient = useQueryClient()

  const { data: profile, isLoading: profileLoading } = useQuery(
    'driverProfile',
    getDriverProfile
  )

  const { data: currentTrip, isLoading: tripLoading } = useQuery(
    'driverCurrentTrip',
    getDriverCurrentTrip,
    { refetchInterval: 10000 }
  )

  const updateLocationMutation = useMutation(updateLocation, {
    onSuccess: () => {
      queryClient.invalidateQueries('driverCurrentTrip')
    }
  })

  const startTripMutation = useMutation(startTrip, {
    onSuccess: () => {
      queryClient.invalidateQueries('driverCurrentTrip')
    }
  })

  const endTripMutation = useMutation(endTrip, {
    onSuccess: () => {
      queryClient.invalidateQueries('driverCurrentTrip')
    }
  })

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [])

  const handleStartTrip = () => {
    if (currentTrip) {
      startTripMutation.mutate({
        tripId: currentTrip._id,
        location: location
      })
    }
  }

  const handleEndTrip = () => {
    if (currentTrip) {
      endTripMutation.mutate({
        tripId: currentTrip._id,
        location: location
      })
    }
  }

  const handleUpdateLocation = () => {
    updateLocationMutation.mutate({
      latitude: location.latitude,
      longitude: location.longitude
    })
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Driver Dashboard</h1>
        <p className="text-gray-600">Welcome back, {profile?.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Driver Information</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-700">
                    {profile?.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{profile?.name}</p>
                  <p className="text-sm text-gray-500">{profile?.email}</p>
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm text-gray-600">License: {profile?.licenseNumber}</p>
                <p className="text-sm text-gray-600">Status: 
                  <span className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    profile?.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profile?.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Current Location */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Current Location</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Lat: {location.latitude.toFixed(6)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Lng: {location.longitude.toFixed(6)}
                </span>
              </div>
              <button
                onClick={handleUpdateLocation}
                disabled={updateLocationMutation.isLoading}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {updateLocationMutation.isLoading ? 'Updating...' : 'Update Location'}
              </button>
            </div>
          </div>
        </div>

        {/* Current Trip */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Current Trip</h2>
              {currentTrip && (
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  currentTrip.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentTrip.status}
                </span>
              )}
            </div>

            {tripLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : currentTrip ? (
              <div className="space-y-6">
                {/* Trip Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Route Information</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Route:</span> {currentTrip.route?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Bus:</span> {currentTrip.bus?.busNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Start Time:</span> {new Date(currentTrip.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Trip Stats</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Passengers:</span> {currentTrip.passengerCount || 0}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Distance:</span> {currentTrip.distanceTraveled || 0} km
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Duration:</span> {currentTrip.duration || 0} min
                      </p>
                    </div>
                  </div>
                </div>

                {/* Route Stops */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Route Stops</h3>
                  <div className="space-y-2">
                    {currentTrip.route?.stops?.map((stop, index) => (
                      <div key={stop._id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                        <div className="flex-shrink-0">
                          {index === 0 ? (
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          ) : index === currentTrip.route.stops.length - 1 ? (
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          ) : (
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{stop.name}</p>
                          <p className="text-xs text-gray-500">{stop.address}</p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {stop.estimatedTime}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trip Actions */}
                <div className="flex space-x-4">
                  {currentTrip.status === 'pending' && (
                    <button
                      onClick={handleStartTrip}
                      disabled={startTripMutation.isLoading}
                      className="flex items-center space-x-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      <Play className="h-4 w-4" />
                      <span>{startTripMutation.isLoading ? 'Starting...' : 'Start Trip'}</span>
                    </button>
                  )}

                  {currentTrip.status === 'active' && (
                    <button
                      onClick={handleEndTrip}
                      disabled={endTripMutation.isLoading}
                      className="flex items-center space-x-2 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      <Square className="h-4 w-4" />
                      <span>{endTripMutation.isLoading ? 'Ending...' : 'End Trip'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active trip assigned</p>
                <p className="text-sm text-gray-400">Please wait for admin to assign a trip</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium">Report Issue</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Update Passengers</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Clock className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium">View Schedule</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DriverDashboard 