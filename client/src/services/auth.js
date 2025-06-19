import api from './api'

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials)
  return response.data
}

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData)
  return response.data
}

export const getProfile = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

export const updateProfile = async (profileData) => {
  const response = await api.put('/auth/update-profile', profileData)
  return response.data
}

export const changePassword = async (passwordData) => {
  const response = await api.post('/auth/change-password', passwordData)
  return response.data
} 