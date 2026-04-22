import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { getSettings, updateSettings, testBotToken, startBot, stopBot, changePassword } from '../lib/api'
import toast from 'react-hot-toast'
import { Settings as SettingsIcon, Bot, Bell, Shield, Save, Check, Key, Clock, RefreshCw } from 'lucide-react'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const [s, setS] = useState(null)
  const [tokenVisible, setTokenVisible] = useState(false)
  const [token, setToken] = useState('')
  const [notifChatId, setNotifChatId] = useState('')
  const [minDelay, setMinDelay] = useState(3)
  const [maxDelay, setMaxDelay] = useState(8)
  const [maxRetries, setMaxRetries] = useState(2)
  const [warnMb, setWarnMb] = useState(100)
  const [curPass, setCurPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [testing, setTesting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('bot')

  const load = async () => {
    const res = await getSettings()
    const d = res.data
    setS(d)
    setNotifChatId(d.notification_chat_id || '')
    setMinDelay(d.min_delay_seconds)
    setMaxDelay(d.max_delay_seconds)
    setMaxRetries(d.max_retries)
    setWarnMb(d.storage_warn_mb)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    const data = { notification_chat_id: notifChatId, min_delay_seconds: minDelay, max_delay_seconds: maxDelay, max_retries: maxRetries, storage_warn_mb: warnMb }
    if (token) data.bot_token = token
    await updateSettings(data)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    toast.success(t('common.success'))
    setToken('')
    load()
  }

  const handleTest = async () => {
    if (token) await updateSettings({ bot_token: token })
    setTesting(true)
    try {
      const res = await testBotToken()
      if (res.data.success) toast.success(`Baglanti basarili — @${res.data.username}`)
      else toast.error(res.data.message)
    } finally { setTesting(false) }
  }

  const handleBotToggle = async () => {
    if (s?.bot_is_running) {
      await stopBot()
      toast.success('Bot durduruldu')
    } else {
      const res = await startBot()
      if (res.data.success) toast.success(`Bot baslatildi — @${res.data.username}`)
      else toast.error(res.data.message)
    }
    load()
  }

  const handleChangePassword = async () => {
    try {
      await changePassword({ current_password: curPass, new_password: newPass })
      toast.success('Sifre degistirildi')
      setCurPass('')
      setNewPass('')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Hata')
    }
  }

  const tabs = [
    { id: 'bot', label: 'Bot Ayarları', icon: Bot },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'security', label: 'Güvenlik', icon: Shield },
  ]

  if (!s) return <div className="text-slate-400 p-10">Yukleniyor...</div>

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-slate-500 to-indigo-600 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            {t('settings.title')}
          </h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">Sistem yapılandırmasını yönetin</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl btn-gradient text-white font-medium shadow-lg shadow-indigo-500/30 text-xs sm:text-sm"
        >
          {saved ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Save className="w-4 h-4 sm:w-5 sm:h-5" />}
          {saved ? 'Kaydedildi' : t('settings.save')}
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Sidebar Tabs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-[#1e1e3a] rounded-xl sm:rounded-2xl border border-indigo-500/20 p-3 sm:p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ x: 4 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white'
                      : 'text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-300'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium text-xs sm:text-sm">{tab.label}</span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          {activeTab === 'bot' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Bot Token */}
              <div className="bg-[#1e1e3a] rounded-xl sm:rounded-2xl border border-indigo-500/20 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Key className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                  {t('settings.botToken')}
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Bot Token</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type={tokenVisible ? 'text' : 'password'}
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        placeholder={s.bot_token_set ? '(degistirmek icin yaz)' : t('settings.botTokenPlaceholder')}
                        className="flex-1 bg-[#16162a] border border-indigo-500/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white input-focus text-sm"
                      />
                      <button
                        onClick={() => setTokenVisible(!tokenVisible)}
                        className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-[#1e1e3a] border border-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-colors text-xs sm:text-sm"
                      >
                        {tokenVisible ? 'Gizle' : 'Goster'}
                      </button>
                      <button
                        onClick={handleTest}
                        disabled={testing}
                        className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors disabled:opacity-50 text-xs sm:text-sm"
                      >
                        {testing ? '...' : t('settings.testToken')}
                      </button>
                    </div>
                  </div>

                  {s.bot_username && (
                    <div className="text-slate-400 text-xs sm:text-sm">@{s.bot_username}</div>
                  )}

                  <button
                    onClick={handleBotToggle}
                    className={`w-full py-2 sm:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-xs sm:text-sm ${
                      s.bot_is_running
                        ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                    }`}
                  >
                    {s.bot_is_running ? t('settings.stopBot') : t('settings.startBot')}
                  </button>
                </div>
              </div>

              {/* Rate Limiting */}
              <div className="bg-[#1e1e3a] rounded-xl sm:rounded-2xl border border-indigo-500/20 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                  Gonderim Ayarlari
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">{t('settings.minDelay')}</label>
                    <input
                      type="number"
                      value={minDelay}
                      onChange={e => setMinDelay(+e.target.value)}
                      min={1}
                      className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white input-focus text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">{t('settings.maxDelay')}</label>
                    <input
                      type="number"
                      value={maxDelay}
                      onChange={e => setMaxDelay(+e.target.value)}
                      min={1}
                      className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white input-focus text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">{t('settings.maxRetries')}</label>
                    <input
                      type="number"
                      value={maxRetries}
                      onChange={e => setMaxRetries(+e.target.value)}
                      min={0}
                      max={5}
                      className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white input-focus text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">{t('settings.storageWarnMb')}</label>
                    <input
                      type="number"
                      value={warnMb}
                      onChange={e => setWarnMb(+e.target.value)}
                      min={10}
                      className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white input-focus text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-[#1e1e3a] rounded-xl sm:rounded-2xl border border-indigo-500/20 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                  {t('settings.notificationChatId')}
                </h3>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Chat ID</label>
                  <input
                    value={notifChatId}
                    onChange={e => setNotifChatId(e.target.value)}
                    placeholder="123456789"
                    className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white input-focus text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-2">{t('settings.notificationChatIdHelp')}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-[#1e1e3a] rounded-xl sm:rounded-2xl border border-indigo-500/20 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                  {t('settings.changePassword')}
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">{t('settings.currentPassword')}</label>
                    <input
                      type="password"
                      value={curPass}
                      onChange={e => setCurPass(e.target.value)}
                      className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white input-focus text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">{t('settings.newPassword')}</label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={e => setNewPass(e.target.value)}
                      className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white input-focus text-sm"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    className="w-full py-2 sm:py-3 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors font-semibold text-xs sm:text-sm"
                  >
                    {t('settings.changePassword')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
