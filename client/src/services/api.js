import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const login = (credentials) => api.post('/auth/login', credentials)
export const register = (userData) => api.post('/auth/register', userData)
export const getProfile = () => api.get('/auth/me')
export const updateProfile = (data) => api.put('/auth/update-profile', data)

// User API
export const searchBus = (params) => api.get('/user/search-bus', { params })
export const getBusLocation = (busId) => api.get(`/user/bus-location/${busId}`)
export const trackBus = (busId) => api.post(`/user/track-bus/${busId}`)
export const getRoutes = () => api.get('/user/routes')
export const getFavoriteRoutes = () => api.get('/user/favorite-routes')
export const addToFavorites = (routeId) => api.post(`/user/favorite-routes/${routeId}`)
export const removeFromFavorites = (routeId) => api.delete(`/user/favorite-routes/${routeId}`)

// Driver API
export const getDriverProfile = () => api.get('/driver/profile')
export const getDriverCurrentTrip = () => api.get('/driver/current-trip')
export const updateLocation = (location) => api.put('/driver/update-location', location)
export const startTrip = (data) => api.post('/driver/start-trip', data)
export const endTrip = (data) => api.post('/driver/end-trip', data)
export const reportIssue = (issue) => api.post('/driver/report-issue', issue)
export const updatePassengerCount = (count) => api.put('/driver/passenger-count', { count })

// Admin API
export const getAdminDashboard = () => api.get('/admin/dashboard')
export const getDrivers = () => api.get('/admin/drivers')
export const getBuses = () => api.get('/admin/buses')
export const getRoutesAdmin = () => api.get('/admin/routes')
export const createDriver = (driverData) => api.post('/admin/drivers', driverData)
export const updateDriver = (driverId, driverData) => api.put(`/admin/drivers/${driverId}`, driverData)
export const deleteDriver = (driverId) => api.delete(`/admin/drivers/${driverId}`)
export const createBus = (busData) => api.post('/admin/buses', busData)
export const updateBus = (busId, busData) => api.put(`/admin/buses/${busId}`, busData)
export const deleteBus = (busId) => api.delete(`/admin/buses/${busId}`)
export const createRoute = (routeData) => api.post('/admin/routes', routeData)
export const updateRoute = (routeId, routeData) => api.put(`/admin/routes/${routeId}`, routeData)
export const deleteRoute = (routeId) => api.delete(`/admin/routes/${routeId}`)

// Prediction API
export const generatePrediction = (data) => api.post('/prediction/generate', data)
export const getStopPredictions = (stopId) => api.get(`/prediction/stop/${stopId}`)
export const getPredictionAnalytics = () => api.get('/prediction/analytics')

export default api 