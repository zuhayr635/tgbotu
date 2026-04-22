import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { getGroups, updateGroup, addGroup, detectUserGroups, promoteBotInGroup, promoteBotBulk, checkGroupPermissions } from '../lib/api'
import toast from 'react-hot-toast'
import { Users, Plus, Search, RefreshCw, ExternalLink, Shield, CheckCircle, XCircle, AlertCircle, Crown, Check } from 'lucide-react'

const TYPE_COLOR = {
  group: { color: '#6366f1', bg: 'bg-indigo-500/20', text: 'text-indigo-400', label: 'Grup' },
  supergroup: { color: '#8b5cf6', bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Supergroup' },
  channel: { color: '#06b6d4', bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Kanal' },
}

export default function GroupsPage() {
  const { t } = useTranslation()
  const [groups, setGroups] = useState([])
  const [search, setSearch] = useState('')
  const [editTag, setEditTag] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [addInput, setAddInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState('all')
  const [detecting, setDetecting] = useState(false)
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [promoteInfo, setPromoteInfo] = useState(null)
  const [checking, setChecking] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState(new Set())
  const [bulkPromoting, setBulkPromoting] = useState(false)
  const [showBulkPromoteModal, setShowBulkPromoteModal] = useState(false)
  const [bulkPromoteInfo, setBulkPromoteInfo] = useState(null)

  const load = async () => {
    try {
      const res = await getGroups(false)
      setGroups(res.data)
      setSelectedGroups(new Set())
    } catch { toast.error('Yuklenemedi') }
  }

  useEffect(() => { load() }, [])

  const handleTagSave = async (id) => {
    await updateGroup(id, { tag: editTag[id] || null })
    toast.success('Etiket kaydedildi')
    load()
  }

  const handleBlacklist = async (id, current) => {
    await updateGroup(id, { is_blacklisted: !current })
    load()
  }

  const handleAdd = async () => {
    if (!addInput.trim()) return
    setAdding(true)
    try {
      const res = await addGroup(addInput.trim())
      toast.success(res.data.message)
      setAddInput('')
      setShowAdd(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Grup eklenemedi')
    } finally {
      setAdding(false)
    }
  }

  const handleDetectGroups = async () => {
    setDetecting(true)
    try {
      const res = await detectUserGroups()
      toast.success(`${res.data.detected} grup tespit edildi`)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Tespit başarısız')
    } finally {
      setDetecting(false)
    }
  }

  const handleCheckPermissions = async () => {
    setChecking(true)
    try {
      const res = await checkGroupPermissions()
      toast.success(`${res.data.checked} grup kontrol edildi`)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Kontrol başarısız')
    } finally {
      setChecking(false)
    }
  }

  const handlePromoteBot = async (group) => {
    setSelectedGroup(group)
    setShowPromoteModal(true)
    try {
      const res = await promoteBotInGroup(group.id)
      setPromoteInfo(res.data)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Bilgi alınamadı')
      setShowPromoteModal(false)
    }
  }

  const toggleGroupSelection = (groupId) => {
    const newSelected = new Set(selectedGroups)
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId)
    } else {
      newSelected.add(groupId)
    }
    setSelectedGroups(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedGroups.size === filtered.length) {
      setSelectedGroups(new Set())
    } else {
      setSelectedGroups(new Set(filtered.map(g => g.id)))
    }
  }

  const handleBulkPromote = async () => {
    if (selectedGroups.size === 0) {
      toast.error('Lütfen en az bir grup seçin')
      return
    }

    setBulkPromoting(true)
    try {
      const groupIds = Array.from(selectedGroups)
      const res = await promoteBotBulk(groupIds)
      setBulkPromoteInfo(res.data)
      setShowBulkPromoteModal(true)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'İşlem başarısız')
    } finally {
      setBulkPromoting(false)
    }
  }

  const filtered = groups.filter(g => {
    const matchSearch = g.title.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (filter === 'admin') return g.is_admin
    if (filter === 'active') return g.is_active && !g.is_blacklisted
    if (filter === 'inactive') return !g.is_active
    if (filter === 'blacklisted') return g.is_blacklisted
    return true
  })

  const adminCount = groups.filter(g => g.is_admin).length
  const blacklistCount = groups.filter(g => g.is_blacklisted).length
  const activeCount = groups.filter(g => g.is_active && !g.is_blacklisted).length
  const inactiveCount = groups.filter(g => !g.is_active).length

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            {t('groups.title')}
          </h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            {groups.length} kayitli · <span className="text-emerald-400">{activeCount} aktif</span> · <span className="text-rose-400">{inactiveCount} bot yok</span> · {adminCount} admin
            {selectedGroups.size > 0 && <span className="text-indigo-400 ml-1 sm:ml-2">· {selectedGroups.size} seçili</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDetectGroups}
            disabled={detecting}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all disabled:opacity-50 text-xs sm:text-sm"
          >
            {detecting ? (
              <>
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                Tespit Ediliyor...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Grupları Tespit Et</span>
                <span className="sm:hidden">Tespit Et</span>
              </>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCheckPermissions}
            disabled={checking}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all disabled:opacity-50 text-xs sm:text-sm"
          >
            {checking ? (
              <>
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                Kontrol Ediliyor...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Yetkileri Kontrol Et</span>
                <span className="sm:hidden">Yetkiler</span>
              </>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAdd(!showAdd)}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium shadow-lg ${
              showAdd
                ? 'bg-rose-500/20 text-rose-400 shadow-rose-500/30'
                : 'btn-gradient text-white shadow-indigo-500/30'
            } text-xs sm:text-sm`}
          >
            {showAdd
              ? <><ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" /> Iptal</>
              : <><Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Grup Ekle</>
            }
          </motion.button>
        </div>
      </motion.div>

      {/* Add Group Panel */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1e1e3a] rounded-xl sm:rounded-2xl border border-indigo-500/30 p-4 sm:p-6"
        >
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">
            Grup / Kanal Ekle
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mb-4">
            Botun üye oldugu bir grubun ID'sini veya @kullaniciadi'ni girin. Bot o grupta olmak zorunda.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={addInput}
              onChange={e => setAddInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="-100123456789 veya @grupadi"
              className="flex-1 bg-[#16162a] border border-indigo-500/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-slate-500 input-focus text-sm"
            />
            <button
              onClick={handleAdd}
              disabled={adding}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl btn-gradient text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {adding ? (
                <>
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ekleniyor...
                </>
              ) : 'Ekle'}
            </button>
          </div>
          <div className="mt-3 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-xs text-slate-500 leading-relaxed">
            <strong className="text-indigo-300">Ipucu:</strong> Grup ID'sini bulmak icin gruba <code className="bg-slate-800 px-2 py-0.5 rounded">@userinfobot</code> ekleyip /start yazin.
            Kanal icin bota yönetici yetkisi verin.
          </div>
        </motion.div>
      )}

      {/* Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-3"
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('groups.search')}
            className="w-full bg-[#1e1e3a] border border-indigo-500/20 rounded-xl pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-white placeholder-slate-500 input-focus text-sm"
          />
        </div>

        {/* Filter Pills & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 sm:gap-2 bg-[#1e1e3a] rounded-xl p-1 border border-indigo-500/20 overflow-x-auto">
            {[
              { key: 'all', label: `Tumu (${groups.length})` },
              { key: 'active', label: `Aktif (${activeCount})` },
              { key: 'inactive', label: `Bot Yok (${inactiveCount})` },
              { key: 'admin', label: `Admin (${adminCount})` },
              { key: 'blacklisted', label: `Kara Liste (${blacklistCount})` },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  filter === f.key
                    ? 'bg-indigo-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Refresh & Select All */}
          <div className="flex items-center gap-2">
            {selectedGroups.size > 0 && (
              <button
                onClick={toggleSelectAll}
                className="px-3 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors text-xs font-semibold"
              >
                {selectedGroups.size === filtered.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={load}
              className="p-2 sm:p-3 rounded-xl bg-[#1e1e3a] border border-indigo-500/20 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40 transition-all"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Bulk Actions Bar */}
      {selectedGroups.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl sm:rounded-2xl border border-indigo-500/30 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm sm:text-base">
              {selectedGroups.size}
            </div>
            <div>
              <p className="text-white font-semibold text-sm sm:text-base">{selectedGroups.size} grup seçildi</p>
              <p className="text-slate-400 text-xs sm:text-sm">Toplu işlemler için bir aksiyon seçin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedGroups(new Set())}
              className="px-3 sm:px-4 py-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors text-xs sm:text-sm font-semibold"
            >
              Temizle
            </button>
            <button
              onClick={handleBulkPromote}
              disabled={bulkPromoting}
              className="px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90 transition-opacity text-xs sm:text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {bulkPromoting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Seçilenlere Botu Ekle</span>
                  <span className="sm:hidden">Bot Ekle</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Groups Grid */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 sm:py-20 bg-[#1e1e3a] rounded-xl sm:rounded-2xl border border-indigo-500/20"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Grup bulunamadi</h3>
          <p className="text-slate-400 text-sm sm:text-base">Arama kriterlerinize uygun grup bulunamadi.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {filtered.map((g, index) => {
            const tc = TYPE_COLOR[g.chat_type] || TYPE_COLOR.group
            const isSelected = selectedGroups.has(g.id)
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className={`bg-[#1e1e3a] rounded-xl sm:rounded-2xl border p-3 sm:p-5 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : !g.is_active
                    ? 'border-rose-500/20 opacity-65'
                    : g.is_blacklisted
                    ? 'border-amber-500/20 opacity-65'
                    : 'border-indigo-500/20'
                }`}
                style={{ 
                  borderLeft: `3px solid ${
                    isSelected 
                      ? '#6366f1'
                      : !g.is_active 
                      ? '#ef4444' 
                      : g.is_blacklisted 
                      ? '#f59e0b' 
                      : '#22c55e'
                  }`
                }}
                onClick={() => toggleGroupSelection(g.id)}
              >
                {/* Selection Checkbox */}
                {selectedGroups.size > 0 && (
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 w-5 h-5 rounded border-2 border-indigo-500 flex items-center justify-center bg-indigo-500/20">
                    {isSelected && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />}
                  </div>
                )}

                {/* Type badge */}
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${tc.bg} border ${tc.color}22 flex items-center justify-center ${tc.text}`}>
                    {g.chat_type === 'channel'
                      ? <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6" />
                      : <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                    }
                  </div>
                  <span className={`text-xs px-2 sm:px-3 py-1 rounded-full font-semibold ${tc.bg} ${tc.text}`}>
                    {tc.label}
                  </span>
                </div>

                <div className="mb-3 sm:mb-4">
                  <h3 className="text-white font-semibold text-sm sm:text-base mb-2">{g.title}</h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {/* Status badge */}
                    {!g.is_active ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-rose-500/20 text-rose-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        Bot Yok
                      </span>
                    ) : g.is_blacklisted ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Kara Liste
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Aktif
                      </span>
                    )}
                    {g.is_admin && (
                      <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                        Admin
                      </span>
                    )}
                    {g.tag && (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                        {g.tag}
                      </span>
                    )}
                  </div>
                  {g.member_count > 0 && (
                    <p className="text-xs text-slate-500 mt-2">{g.member_count.toLocaleString()} uye</p>
                  )}
                  {g.username && (
                    <p className="text-xs text-slate-500">@{g.username}</p>
                  )}
                  {g.chat_type === 'channel' && !g.is_admin && (
                    <p className="text-amber-400 text-xs mt-2">
                      {t('groups.adminRequired')}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-indigo-500/10" onClick={e => e.stopPropagation()}>
                  <input
                    value={editTag[g.id] !== undefined ? editTag[g.id] : (g.tag || '')}
                    onChange={e => setEditTag({ ...editTag, [g.id]: e.target.value })}
                    placeholder="Etiket..."
                    className="flex-1 min-w-[80px] bg-[#16162a] border border-indigo-500/20 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs text-white input-focus"
                  />
                  <button
                    onClick={() => handleTagSave(g.id)}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors text-xs font-semibold"
                  >
                    Kaydet
                  </button>
                  {!g.is_admin && g.is_active && (
                    <button
                      onClick={() => handlePromoteBot(g)}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors text-xs font-semibold flex items-center gap-1"
                    >
                      <Crown className="w-3 h-3" />
                      <span className="hidden sm:inline">Admin Yap</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleBlacklist(g.id, g.is_blacklisted)}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-colors ${
                      g.is_blacklisted
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                    }`}
                  >
                    {g.is_blacklisted ? 'Aktive' : 'Devre Disi'}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Promote Bot Modal */}
      {showPromoteModal && promoteInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={() => setShowPromoteModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1e1e3a] rounded-xl sm:rounded-2xl border border-purple-500/30 p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                Botu Yönetici Yap
              </h2>
              <button
                onClick={() => setShowPromoteModal(false)}
                className="p-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
              >
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="bg-purple-500/10 rounded-xl p-3 sm:p-4 border border-purple-500/20">
                <p className="text-purple-300 font-semibold mb-2 text-sm sm:text-base">{promoteInfo.group_title}</p>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Bot kullanıcı adı: <span className="text-white font-mono">@{promoteInfo.bot_username}</span>
                </p>
              </div>

              <div className="bg-amber-500/10 rounded-xl p-3 sm:p-4 border border-amber-500/20">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-300 font-semibold mb-2 text-sm sm:text-base">Önemli Not</p>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Botlar kendilerini yönetici yapamazlar. Bu işlemi manuel olarak yapmanız gerekmektedir.
                      Aşağıdaki adımları takip edin.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#16162a] rounded-xl p-3 sm:p-4 border border-indigo-500/20">
                <p className="text-indigo-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Adımlar:</p>
                <ol className="space-y-1.5 sm:space-y-2 text-slate-300 text-xs sm:text-sm">
                  {promoteInfo.instructions.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: step.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/`([^`]+)`/g, '<code class="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">$1</code>') }} />
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                {promoteInfo.group_link && (
                  <a
                    href={promoteInfo.group_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors text-center font-semibold flex items-center justify-center gap-2 text-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Gruba Git
                  </a>
                )}
                <a
                  href={promoteInfo.bot_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors text-center font-semibold flex items-center justify-center gap-2 text-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Botu Görüntüle
                </a>
              </div>

              <div className="bg-emerald-500/10 rounded-xl p-3 sm:p-4 border border-emerald-500/20">
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-300 font-semibold mb-1 text-sm sm:text-base">Anonim Mod</p>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Bot anonim olarak çalışacak, yönetici işlemleri grupta görünmeyecek.
                      "Yönetici Ekleme" yetkisi vermediğinizden emin olun (güvenlik için).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowPromoteModal(false)
                  load()
                }}
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity text-sm"
              >
                Tamam, Yetkileri Verdim
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Bulk Promote Modal */}
      {showBulkPromoteModal && bulkPromoteInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={() => setShowBulkPromoteModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1e1e3a] rounded-xl sm:rounded-2xl border border-purple-500/30 p-4 sm:p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                {bulkPromoteInfo.groups.length} Gruba Botu Ekle
              </h2>
              <button
                onClick={() => setShowBulkPromoteModal(false)}
                className="p-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
              >
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-indigo-500/10 rounded-lg p-2 sm:p-3 border border-indigo-500/20">
                  <p className="text-indigo-300 font-semibold text-xs sm:text-sm">Toplam Grup</p>
                  <p className="text-white text-xl sm:text-2xl font-bold">{bulkPromoteInfo.total}</p>
                </div>
                <div className="bg-amber-500/10 rounded-lg p-2 sm:p-3 border border-amber-500/20">
                  <p className="text-amber-300 font-semibold text-xs sm:text-sm">Zaten Admin</p>
                  <p className="text-white text-xl sm:text-2xl font-bold">{bulkPromoteInfo.already_admin}</p>
                </div>
                <div className="bg-rose-500/10 rounded-lg p-2 sm:p-3 border border-rose-500/20">
                  <p className="text-rose-300 font-semibold text-xs sm:text-sm">Üye Değil</p>
                  <p className="text-white text-xl sm:text-2xl font-bold">{bulkPromoteInfo.not_member}</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-[#16162a] rounded-xl p-3 sm:p-4 border border-indigo-500/20">
                <p className="text-indigo-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Yapılacak İşlemler:</p>
                <ol className="space-y-1.5 sm:space-y-2 text-slate-300 text-xs sm:text-sm">
                  {bulkPromoteInfo.instructions.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Groups List */}
              <div className="bg-[#16162a] rounded-xl p-3 sm:p-4 border border-indigo-500/20">
                <p className="text-indigo-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Seçilen Gruplar:</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {bulkPromoteInfo.groups.map((group, idx) => (
                    <div key={idx} className="flex items-start gap-2 sm:gap-3 p-2 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                      <div className="flex-shrink-0 mt-0.5">
                        {group.is_admin ? (
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                        ) : !group.is_member ? (
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                        ) : (
                          <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{group.title}</p>
                        {group.username && <p className="text-slate-400 text-xs">@{group.username}</p>}
                        <p className="text-slate-500 text-xs">
                          {group.is_admin && 'Zaten Admin'}
                          {!group.is_member && 'Üye Değil'}
                          {!group.is_admin && group.is_member && 'Hazır'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-500/10 rounded-xl p-3 sm:p-4 border border-amber-500/20">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-300 font-semibold mb-2 text-sm sm:text-base">Önemli Not</p>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Her gruba giderek botu yönetici yapmanız gerekecektir. Telegram API'sinin kısıtlamaları nedeniyle bu işlem otomatik yapılamaz.
                      Bot anonim olarak çalışacak şekilde yapılandırıldığından "Yönetici Ekleme" yetkisi vermediğinizden emin olun.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowBulkPromoteModal(false)}
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 transition-colors font-semibold text-sm"
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  setShowBulkPromoteModal(false)
                  setSelectedGroups(new Set())
                  load()
                }}
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity text-sm"
              >
                Tamam, Anladım
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
