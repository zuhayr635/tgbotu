import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Her istekte token ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401 gelince login'e yönlendir
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// Auth
export const login = (username, password) => {
  const form = new FormData()
  form.append('username', username)
  form.append('password', password)
  return api.post('/auth/login', form)
}
export const changePassword = (data) => api.post('/auth/change-password', data)

// Dashboard
export const getDashboard = () => api.get('/dashboard')
export const cleanupStorage = () => api.delete('/dashboard/storage/cleanup')

// Groups
export const getGroups = (activeOnly = true) => api.get(`/groups?active_only=${activeOnly}`)
export const updateGroup = (id, data) => api.patch(`/groups/${id}`, data)
export const getTags = () => api.get('/groups/tags')
export const addGroup = (chatId) => api.post('/groups/add', { chat_id: String(chatId) })

// Broadcasts
export const createBroadcast = (formData) => api.post('/broadcasts', formData)
export const listBroadcasts = (skip = 0, limit = 20) => api.get(`/broadcasts?skip=${skip}&limit=${limit}`)
export const getBroadcastLogs = (id) => api.get(`/broadcasts/${id}/logs`)
export const retryFailed = (id) => api.post(`/broadcasts/${id}/retry-failed`)
export const skipGroup = (broadcastId, chatId) => api.post(`/broadcasts/${broadcastId}/skip/${chatId}`)
export const cancelBroadcast = (id) => api.post(`/broadcasts/${id}/cancel`)
export const getBroadcastProgress = (id) => api.get(`/broadcasts/${id}/progress`)

// Schedules
export const createSchedule = (formData) => api.post('/schedules', formData)
export const listSchedules = (status) => api.get(`/schedules${status ? `?status=${status}` : ''}`)
export const cancelSchedule = (id) => api.delete(`/schedules/${id}`)

// Templates
export const listTemplates = () => api.get('/templates')
export const listTemplateCategories = () => api.get('/templates/categories')
export const createTemplate = (formData) => api.post('/templates', formData)
export const deleteTemplate = (id) => api.delete(`/templates/${id}`)

// Settings
export const getSettings = () => api.get('/settings')
export const updateSettings = (data) => api.put('/settings', data)
export const testBotToken = () => api.post('/settings/bot/test')
export const startBot = () => api.post('/settings/bot/start')
export const stopBot = () => api.post('/settings/bot/stop')
