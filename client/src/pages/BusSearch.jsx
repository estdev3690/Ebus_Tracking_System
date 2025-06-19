import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Search, MapPin, Clock, Bus } from 'lucide-react'

const BusSearch = () => {
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // Mock search results for now
      const mockResults = [
        {
          route: {
            _id: '1',
            routeNumber: 'R101',
            routeName: 'Central to Airport',
            totalDistance: 25,
            estimatedDuration: 45,
            fare: 15,
            sourceStop: 'Central Station',
            destinationStop: 'Airport Terminal',
          },
          activeBuses: 2,
          nextPredictions: [
            {
              predictedArrivalTime: new Date(Date.now() + 10 * 60000),
              busId: { busNumber: 'B101', busType: 'AC' },
            },
            {
              predictedArrivalTime: new Date(Date.now() + 25 * 60000),
              busId: { busNumber: 'B102', busType: 'Non-AC' },
            },
          ],
          operatingHours: { start: '06:00', end: '22:00' },
          frequency: 15,
        },
      ]
      
      setSearchResults(mockResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Bus</h1>
        <p className="text-gray-600 mb-6">
          Find buses by entering your source and destination locations.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
                From
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="source"
                  type="text"
                  {...register('source', { required: 'Source location is required' })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter source location"
                />
              </div>
              {errors.source && (
                <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                To
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="destination"
                  type="text"
                  {...register('destination', { required: 'Destination location is required' })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter destination location"
                />
              </div>
              {errors.destination && (
                <p className="mt-1 text-sm text-red-600">{errors.destination.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Search Buses
              </>
            )}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
          {searchResults.map((result, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Route {result.route.routeNumber}: {result.route.routeName}
                  </h3>
                  <p className="text-gray-600">
                    {result.route.sourceStop} → {result.route.destinationStop}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">${result.route.fare}</p>
                  <p className="text-sm text-gray-500">Fare</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{result.route.estimatedDuration} min</p>
                    <p className="text-xs text-gray-500">Duration</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Bus className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{result.activeBuses}</p>
                    <p className="text-xs text-gray-500">Active Buses</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{result.frequency} min</p>
                    <p className="text-xs text-gray-500">Frequency</p>
                  </div>
                </div>
              </div>

              {/* Next Arrivals */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Next Arrivals</h4>
                <div className="space-y-2">
                  {result.nextPredictions.map((prediction, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <Bus className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium">
                          {prediction.busId.busNumber} ({prediction.busId.busType})
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(prediction.predictedArrivalTime).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700">Track Bus</button>
                <button className="flex-1 border border-primary-600 text-primary-600 py-2 px-4 rounded-md hover:bg-primary-50">View Route Details</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {searchResults.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-6 text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No buses found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or check back later.
          </p>
        </div>
      )}
    </div>
  )
}

export default BusSearch 