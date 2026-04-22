import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { getBots, createBot, toggleBot, deleteBot } from '../lib/api'
import toast from 'react-hot-toast'
import {
  Bot,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Users,
  Check,
  X,
  Eye,
  EyeOff,
} from 'lucide-react'

export default function BotsPage() {
  const { t } = useTranslation()
  const [bots, setBots] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newToken, setNewToken] = useState('')
  const [showToken, setShowToken] = useState({})

  const loadBots = async () => {
    try {
      setLoading(true)
      const res = await getBots()
      setBots(res.data)
    } catch (error) {
      toast.error('Botlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBots()
  }, [])

  const handleAddBot = async (e) => {
    e.preventDefault()
    if (!newToken.trim()) {
      toast.error('Bot token boş olamaz')
      return
    }

    try {
      await createBot({ token: newToken })
      toast.success('Bot başarıyla eklendi')
      setNewToken('')
      setShowAddForm(false)
      loadBots()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Bot eklenemedi')
    }
  }

  const handleToggleBot = async (botId) => {
    try {
      await toggleBot(botId)
      toast.success('Bot durumu güncellendi')
      loadBots()
    } catch (error) {
      toast.error('İşlem başarısız')
    }
  }

  const handleDeleteBot = async (botId) => {
    if (!confirm('Bu botu silmek istediğinizden emin misiniz?')) return
    try {
      await deleteBot(botId)
      toast.success('Bot silindi')
      loadBots()
    } catch (error) {
      toast.error('Silme başarısız')
    }
  }

  const toggleTokenVisibility = (botId) => {
    setShowToken(prev => ({ ...prev, [botId]: !prev[botId] }))
  }

  const maskToken = (token) => {
    if (!token) return ''
    const parts = token.split(':')
    if (parts.length === 2) {
      const [botId, secret] = parts
      return `${botId}:${secret.substring(0, 8)}${'*'.repeat(Math.max(0, secret.length - 8))}`
    }
    return token.substring(0, 12) + '*'.repeat(Math.max(0, token.length - 12))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-400" />
            Bot Yönetimi
          </h1>
          <p className="text-slate-400">Telegram botlarınızı yönetin</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Bot Ekle
        </motion.button>
      </motion.div>

      {/* Add Bot Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Yeni Bot Ekle</h3>
          <form onSubmit={handleAddBot} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-2">Bot Token</label>
              <input
                type="text"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="w-full px-4 py-3 bg-[#16162a] border border-indigo-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                required
              />
              <p className="text-slate-500 text-xs mt-2">
                Bot token'i @BotFather'dan alabilirsiniz
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
              >
                <Check className="w-4 h-4" />
                Ekle
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setNewToken('')
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                İptal
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Bots List */}
      <div className="grid grid-cols-1 gap-4">
        {bots.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-12 text-center"
          >
            <Bot className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Henüz bot eklenmemiş</h3>
            <p className="text-slate-400 mb-4">İlk botunuzu eklemek için yukarıdaki butona tıklayın</p>
          </motion.div>
        ) : (
          bots.map((bot, index) => (
            <motion.div
              key={bot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-[#1e1e3a] rounded-2xl border p-6 transition-all ${
                bot.is_active
                  ? 'border-emerald-500/20 hover:border-emerald-500/30'
                  : 'border-slate-500/20 hover:border-slate-500/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        bot.is_active ? 'bg-emerald-500/20' : 'bg-slate-500/20'
                      }`}
                    >
                      <Bot
                        className={`w-6 h-6 ${bot.is_active ? 'text-emerald-400' : 'text-slate-400'}`}
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        {bot.bot_username || `Bot #${bot.id}`}
                        {bot.is_active ? (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded-full">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-500/20 text-slate-300 text-xs rounded-full">
                            Pasif
                          </span>
                        )}
                      </h3>
                      <p className="text-slate-400 text-sm">Bot ID: {bot.bot_id || 'Bilinmiyor'}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">Token:</span>
                      <code className="flex-1 px-3 py-1.5 bg-[#16162a] rounded-lg text-slate-300 font-mono text-xs">
                        {showToken[bot.id] ? bot.token : maskToken(bot.token)}
                      </code>
                      <button
                        onClick={() => toggleTokenVisibility(bot.id)}
                        className="p-1.5 hover:bg-indigo-500/10 rounded-lg transition-colors"
                      >
                        {showToken[bot.id] ? (
                          <EyeOff className="w-4 h-4 text-slate-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Users className="w-4 h-4" />
                        <span>{bot.group_count} Grup</span>
                      </div>
                      <div className="text-slate-500">
                        {new Date(bot.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleBot(bot.id)}
                    className={`p-3 rounded-xl transition-colors ${
                      bot.is_active
                        ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                    }`}
                    title={bot.is_active ? 'Pasife Al' : 'Aktife Et'}
                  >
                    {bot.is_active ? (
                      <PowerOff className="w-5 h-5" />
                    ) : (
                      <Power className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteBot(bot.id)}
                    className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6"
      >
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-400" />
          Bot Nasıl Eklenir?
        </h3>
        <ol className="text-slate-400 text-sm space-y-1 list-decimal list-inside">
          <li>@BotFather botunu Telegram'da açın</li>
          <li>/newbot komutunu gönderin</li>
          <li>Botunuza bir isim verin</li>
          <li>Size verilen token'i kopyalayın ve yukarıya yapıştırın</li>
          <li>Botu gruplarınıza ekleyin ve yönetici yapın</li>
        </ol>
      </motion.div>
    </div>
  )
}
