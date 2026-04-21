import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { getGroups, getTags, createBroadcast, createSchedule, skipGroup, cancelBroadcast } from '../lib/api'
import toast from 'react-hot-toast'
import { Send, Users, Clock, Image as ImageIcon, Calendar, Check } from 'lucide-react'
import ProgressBar from '../components/ProgressBar'

export default function NewBroadcastPage() {
  const { t } = useTranslation()
  const [groups, setGroups] = useState([])
  const [tags, setTags] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [tagFilter, setTagFilter] = useState('')
  const [message, setMessage] = useState('')
  const [media, setMedia] = useState(null)
  const [disablePreview, setDisablePreview] = useState(false)
  const [parseMode, setParseMode] = useState('HTML')
  const [mode, setMode] = useState('now')
  const [runAt, setRunAt] = useState('')
  const [repeatType, setRepeatType] = useState('none')
  const [repeatEndAt, setRepeatEndAt] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)
  const [broadcastId, setBroadcastId] = useState(null)
  const [progress, setProgress] = useState(null)
  const wsRef = useRef(null)

  useEffect(() => {
    getGroups().then(r => setGroups(r.data.filter(g => !g.is_blacklisted)))
    getTags().then(r => setTags(r.data))
    const tplRaw = localStorage.getItem('tpl_load')
    if (tplRaw) {
      try {
        const tpl = JSON.parse(tplRaw)
        if (tpl.message_text) setMessage(tpl.message_text)
        if (tpl.parse_mode) setParseMode(tpl.parse_mode)
        if (tpl.disable_preview !== undefined) setDisablePreview(tpl.disable_preview)
        localStorage.removeItem('tpl_load')
      } catch (_) {}
    }
  }, [])

  const filtered = tagFilter ? groups.filter(g => g.tag === tagFilter) : groups
  const allSelected = filtered.length > 0 && filtered.every(g => selectedIds.includes(g.chat_id))

  const toggleAll = () => {
    const ids = filtered.map(g => g.chat_id)
    if (allSelected) setSelectedIds(prev => prev.filter(id => !ids.includes(id)))
    else setSelectedIds(prev => [...new Set([...prev, ...ids])])
  }

  const toggle = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const startProgressWS = (bcId) => {
    const token = localStorage.getItem('token')
    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/broadcasts/${bcId}/ws?token=${token}`)
    wsRef.current = ws
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setProgress(data)
      if (data.status === 'completed' || data.status === 'cancelled') {
        setBroadcasting(false)
        ws.close()
      }
    }
    ws.onerror = () => setBroadcasting(false)
  }

  const handleSend = async () => {
    if (!message.trim() && !media) return toast.error('Mesaj veya medya gerekli')
    if (selectedIds.length === 0) return toast.error('En az bir grup secin')
    const fd = new FormData()
    fd.append('message_text', message)
    fd.append('chat_ids', JSON.stringify(selectedIds))
    fd.append('disable_preview', disablePreview)
    fd.append('parse_mode', parseMode)
    if (media) fd.append('media', media)
    try {
      if (mode === 'now') {
        const res = await createBroadcast(fd)
        const bcId = res.data.broadcast_id
        setBroadcastId(bcId)
        setBroadcasting(true)
        setProgress({ total: selectedIds.length, sent: 0, failed: 0, skipped: 0, status: 'running' })
        startProgressWS(bcId)
        toast.success('Yayin baslatildi')
      } else {
        if (!runAt) return toast.error('Tarih ve saat secin')
        fd.append('run_at', runAt)
        fd.append('repeat_type', repeatType)
        if (repeatEndAt) fd.append('repeat_end_at', repeatEndAt)
        await createSchedule(fd)
        toast.success('Gorev zamanlandı')
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Hata olustu')
    }
  }

  const totalRecipients = filtered.filter(g => selectedIds.includes(g.chat_id)).reduce((sum, g) => sum + (g.member_count || 0), 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            {t('broadcast.title')}
          </h1>
          <p className="text-slate-400 mt-1">Mesajinizi yazin, gruplarınızı secin ve gonderin</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Composer */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Message Composer */}
          <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-indigo-500/10 bg-[#16162a]/50">
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer">
                <ImageIcon className="w-4 h-4" />
                <span className="text-sm">{media ? media.name : t('broadcast.uploadMedia')}</span>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={e => setMedia(e.target.files[0])} />
              </label>
              {media && (
                <button onClick={() => setMedia(null)} className="px-3 py-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors text-sm">
                  Kaldır
                </button>
              )}
              <div className="flex-1" />
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input type="checkbox" checked={disablePreview} onChange={e => setDisablePreview(e.target.checked)} className="accent-indigo-500" />
                {t('broadcast.disablePreview')}
              </label>
              <select value={parseMode} onChange={e => setParseMode(e.target.value)} className="bg-[#16162a] border border-indigo-500/20 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none">
                <option value="HTML">HTML</option>
                <option value="Markdown">Markdown</option>
              </select>
            </div>

            {/* Text Area */}
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Mesajinizi yazin... {Merhaba|Selam} {grup_adi} gibi spintax ve degisken kullanabilirsiniz."
              rows={10}
              className="w-full bg-[#16162a] px-4 py-4 text-white placeholder-slate-500 resize-none focus:outline-none"
            />

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-indigo-500/10 bg-[#16162a]/50">
              <span className="text-xs text-slate-500">
                Spintax: {'{Merhaba|Selam|Hey}'}  •  Degiskenler: {'{grup_adi}'} {'{tarih}'} {'{saat}'}
              </span>
              <span className="text-sm text-slate-500">{message.length} karakter</span>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
            <label className="block text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Zamanlama
            </label>
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode('now')}
                className={`flex-1 flex items-center justify-center gap-3 px-4 py-4 rounded-xl border transition-all duration-300 ${
                  mode === 'now'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-indigo-500/20 text-slate-400 hover:border-indigo-500/40'
                }`}
              >
                <Send className="w-5 h-5" />
                <span className="font-medium">{t('broadcast.sendNow')}</span>
                {mode === 'now' && <Check className="w-5 h-5 ml-2" />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode('schedule')}
                className={`flex-1 flex items-center justify-center gap-3 px-4 py-4 rounded-xl border transition-all duration-300 ${
                  mode === 'schedule'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-indigo-500/20 text-slate-400 hover:border-indigo-500/40'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="font-medium">{t('broadcast.schedule')}</span>
                {mode === 'schedule' && <Check className="w-5 h-5 ml-2" />}
              </motion.button>
            </div>

            <AnimatePresence>
              {mode === 'schedule' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t('broadcast.scheduleDate')}</label>
                    <input
                      type="datetime-local"
                      value={runAt}
                      onChange={e => setRunAt(e.target.value)}
                      className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-4 py-3 text-white input-focus transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Tekrar</label>
                    <select
                      value={repeatType}
                      onChange={e => setRepeatType(e.target.value)}
                      className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-4 py-3 text-white input-focus transition-all duration-300"
                    >
                      <option value="none">Tekrarsiz</option>
                      <option value="daily">Her gun</option>
                      <option value="weekly">Her hafta</option>
                      <option value="monthly">Her ay</option>
                    </select>
                  </div>
                  {repeatType !== 'none' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Tekrar bitis tarihi (opsiyonel)</label>
                      <input
                        type="datetime-local"
                        value={repeatEndAt}
                        onChange={e => setRepeatEndAt(e.target.value)}
                        className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-4 py-3 text-white input-focus transition-all duration-300"
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress */}
          {progress && (
            <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-white font-semibold text-sm">
                    {t('broadcast.progress')} — {Math.round((progress.sent + progress.skipped) / progress.total * 100)}%
                  </div>
                  {progress.current_title && broadcasting && (
                    <div className="text-slate-500 text-xs mt-1">
                      Gonderiliyor: {progress.current_title}
                    </div>
                  )}
                </div>
                {broadcasting && (
                  <button
                    onClick={async () => { if (broadcastId) { await cancelBroadcast(broadcastId); setBroadcasting(false) } }}
                    className="px-4 py-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors text-sm font-medium"
                  >
                    {t('broadcast.cancel')}
                  </button>
                )}
              </div>
              <ProgressBar progress={(progress.sent + progress.skipped) / progress.total * 100} status={progress.status} />
              <div className="grid grid-cols-4 gap-4 mt-4">
                {[
                  { label: 'Gonderildi', value: progress.sent, color: 'text-emerald-400' },
                  { label: 'Basarisiz', value: progress.failed, color: 'text-rose-400' },
                  { label: 'Atlanan', value: progress.skipped, color: 'text-slate-400' },
                  { label: 'Toplam', value: progress.total, color: 'text-indigo-400' },
                ].map(s => (
                  <div key={s.label} className="bg-[#16162a]/50 rounded-xl p-3 text-center">
                    <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
              {progress.current_title && broadcasting && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => { if (broadcastId) skipGroup(broadcastId, progress.current_chat_id) }}
                    className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors text-sm"
                  >
                    {t('broadcast.skip')} Bu Grubu
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Right Column - Groups & Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Group Selection */}
          <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                {t('broadcast.selectGroups')}
              </label>
              <span className="text-xs text-slate-500">{selectedIds.length} secildi</span>
            </div>

            <button
              onClick={toggleAll}
              className="w-full mb-3 px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors text-sm font-medium"
            >
              {allSelected ? 'Tumunu Kaldir' : 'Tumunu Sec'}
            </button>

            {tags.length > 0 && (
              <select
                value={tagFilter}
                onChange={e => setTagFilter(e.target.value)}
                className="w-full mb-3 bg-[#16162a] border border-indigo-500/20 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
              >
                <option value="">{t('broadcast.filterByTag')}</option>
                {tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
              </select>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {filtered.length === 0
                ? <p className="text-slate-400 text-sm text-center py-4">{t('broadcast.noGroups')}</p>
                : filtered.map(g => {
                  const sel = selectedIds.includes(g.chat_id)
                  return (
                    <motion.button
                      key={g.chat_id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => toggle(g.chat_id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left ${
                        sel
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-indigo-500/20 hover:border-indigo-500/40 bg-[#16162a]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        sel ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600'
                      }`}>
                        {sel && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${sel ? 'text-indigo-300' : 'text-slate-300'}`}>{g.title}</p>
                        <p className="text-xs text-slate-500">{g.chat_type}{g.tag ? ` • ${g.tag}` : ''}</p>
                      </div>
                    </motion.button>
                  )
                })
              }
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl border border-indigo-500/30 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Ozet</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Secilen Gruplar</span>
                <span className="text-white font-medium">{selectedIds.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Toplam Alıcı</span>
                <span className="text-white font-medium">{totalRecipients.toLocaleString()}</span>
              </div>
              <div className="h-px bg-indigo-500/20 my-3" />
              <div className="flex justify-between">
                <span className="text-slate-400">Gonderim Turu</span>
                <span className="text-indigo-300 font-medium">
                  {mode === 'now' ? 'Anlik' : 'Zamanlanmış'}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSend}
            disabled={broadcasting}
            className="w-full py-4 rounded-xl btn-gradient text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
          >
            <Send className="w-5 h-5" />
            {broadcasting ? 'Gonderiliyor...' : (mode === 'now' ? t('broadcast.sendNow') : t('broadcast.saveTask'))}
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
