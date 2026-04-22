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
      localStorage.removeItem('user')
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
export const register = (data) => api.post('/auth/register', data)
export const getMe = () => api.get('/auth/me')
export const changePassword = (data) => api.post('/auth/change-password', data)

// Users
export const getUserProfile = () => api.get('/users/profile')
export const updateUserProfile = (data) => api.put('/users/profile', data)
export const getTokenInfo = () => api.get('/users/tokens')
export const getPlanInfo = () => api.get('/users/plan')

// Admin
export const adminGetUsers = (statusFilter) => api.get(`/admin/users${statusFilter ? `?status=${statusFilter}` : ''}`)
export const adminGetUser = (userId) => api.get(`/admin/users/${userId}`)
export const adminApproveUser = (userId, data) => api.patch(`/admin/users/${userId}/approve`, data)
export const adminRejectUser = (userId) => api.patch(`/admin/users/${userId}/reject`)
export const adminDeleteUser = (userId) => api.delete(`/admin/users/${userId}`)
export const adminGetPlanLimits = () => api.get('/admin/plan-limits')
export const adminGetPlanLimit = (planType) => api.get(`/admin/plan-limits/${planType}`)
export const adminUpdatePlanLimit = (planType, data) => api.patch(`/admin/plan-limits/${planType}`, data)
export const adminGetStats = () => api.get('/admin/stats')

// Bots
export const getBots = () => api.get('/bots')
export const getBot = (botId) => api.get(`/bots/${botId}`)
export const createBot = (data) => api.post('/bots', data)
export const toggleBot = (botId) => api.patch(`/bots/${botId}/toggle`)
export const deleteBot = (botId) => api.delete(`/bots/${botId}`)

// Dashboard
export const getDashboard = () => api.get('/dashboard')
export const cleanupStorage = () => api.delete('/dashboard/storage/cleanup')

// Groups
export const getGroups = (activeOnly = true) => api.get(`/groups?active_only=${activeOnly}`)
export const updateGroup = (id, data) => api.patch(`/groups/${id}`, data)
export const getTags = () => api.get('/groups/tags')
export const addGroup = (chatId) => api.post('/groups/add', { chat_id: String(chatId) })
export const addGroupsBulk = (groupIds) => api.post('/groups/add-bulk', { group_ids: groupIds })
export const getBotGroups = () => api.get('/groups/bot-groups')
export const detectUserGroups = () => api.post('/groups/detect-groups')
export const promoteBotInGroup = (groupId) => api.post('/groups/promote-bot', { group_id: groupId })
export const promoteBotBulk = (groupIds) => api.post('/groups/promote-bot-bulk', { group_ids: groupIds })
export const checkGroupPermissions = () => api.post('/groups/check-permissions')

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
