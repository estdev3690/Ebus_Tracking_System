import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { MapPin, Clock, Gauge, Navigation } from 'lucide-react'

const BusTracking = () => {
  const { busId } = useParams()
  const [busData, setBusData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock bus data for demonstration
    const mockBusData = {
      _id: busId,
      busNumber: busId.startsWith('bus-') ? `B${busId.replace('bus-', '')}` : busId,
      busType: 'AC',
      capacity: 50,
      currentCapacity: 25,
      availableSeats: 25,
      status: 'on_trip',
      currentLocation: {
        coordinates: [77.2090, 28.6139], // Delhi coordinates
        address: 'Connaught Place, New Delhi'
      },
      speed: 35,
      direction: 180,
      lastLocationUpdate: new Date(),
      currentRoute: {
        routeNumber: busId.startsWith('bus-') ? `R${busId.replace('bus-', '')}` : 'R101',
        routeName: getRouteName(busId),
        stops: getRouteStops(busId)
      },
      currentDriver: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+91 98765 43210'
      }
    }

    setTimeout(() => {
      setBusData(mockBusData)
      setLoading(false)
    }, 1000)
  }, [busId])

  // Helper functions to get route data based on bus ID
  const getRouteName = (busId) => {
    const routeMap = {
      'bus-1': 'Central to Airport',
      'bus-2': 'Downtown Loop',
      'bus-3': 'University Express'
    }
    return routeMap[busId] || 'Unknown Route'
  }

  const getRouteStops = (busId) => {
    const stopsMap = {
      'bus-1': [
        { name: 'Central Station', stopNumber: 1 },
        { name: 'Connaught Place', stopNumber: 2 },
        { name: 'Airport Terminal', stopNumber: 3 }
      ],
      'bus-2': [
        { name: 'City Center', stopNumber: 1 },
        { name: 'Shopping District', stopNumber: 2 },
        { name: 'Business Park', stopNumber: 3 },
        { name: 'Residential Area', stopNumber: 4 }
      ],
      'bus-3': [
        { name: 'Student Center', stopNumber: 1 },
        { name: 'Campus Main', stopNumber: 2 }
      ]
    }
    return stopsMap[busId] || [
      { name: 'Unknown Stop', stopNumber: 1 }
    ]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!busData) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Bus not found</h3>
        <p className="text-gray-600">The requested bus could not be found or is offline.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Bus Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bus {busData.busNumber} Tracking
            </h1>
            <p className="text-gray-600">{busData.currentRoute.routeName}</p>
          </div>
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              busData.status === 'on_trip' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {busData.status === 'on_trip' ? 'On Trip' : 'Offline'}
            </div>
          </div>
        </div>
      </div>

      {/* Bus Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Current Location</h3>
              <p className="text-sm text-gray-600">{busData.currentLocation.address}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Gauge className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Speed</h3>
              <p className="text-sm text-gray-600">{busData.speed} km/h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Navigation className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Direction</h3>
              <p className="text-sm text-gray-600">{busData.direction}°</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Last Update</h3>
              <p className="text-sm text-gray-600">
                {new Date(busData.lastLocationUpdate).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Location</h2>
        <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Map integration coming soon</p>
            <p className="text-sm text-gray-500">
              Coordinates: {busData.currentLocation.coordinates[0]}, {busData.currentLocation.coordinates[1]}
            </p>
          </div>
        </div>
      </div>

      {/* Route Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Route Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Route Number:</span>
              <span className="font-medium">{busData.currentRoute.routeNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Route Name:</span>
              <span className="font-medium">{busData.currentRoute.routeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Capacity:</span>
              <span className="font-medium">{busData.currentCapacity}/{busData.capacity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Available Seats:</span>
              <span className="font-medium">{busData.availableSeats}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Driver Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Driver Name:</span>
              <span className="font-medium">
                {busData.currentDriver.firstName} {busData.currentDriver.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Contact:</span>
              <span className="font-medium">{busData.currentDriver.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Route Stops */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Route Stops</h2>
        <div className="space-y-2">
          {busData.currentRoute.stops.map((stop, index) => (
            <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-medium text-primary-600">{stop.stopNumber}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stop.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BusTracking 