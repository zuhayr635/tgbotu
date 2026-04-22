import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  adminGetUsers,
  adminApproveUser,
  adminRejectUser,
  adminDeleteUser,
  adminGetStats,
} from '../lib/api'
import toast from 'react-hot-toast'
import {
  Users,
  Check,
  X,
  Trash2,
  Shield,
  Clock,
  TrendingUp,
  Bot,
  MessageSquare,
} from 'lucide-react'
import StatCard from '../components/StatCard'

const statusColors = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
}

const planColors = {
  free: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  weekly: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  monthly: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
}

export default function AdminPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersRes, statsRes] = await Promise.all([
        adminGetUsers(filter === 'all' ? null : filter),
        adminGetStats(),
      ])
      setUsers(usersRes.data)
      setStats(statsRes.data)
    } catch (error) {
      toast.error('Veriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filter])

  const handleApprove = async (userId) => {
    try {
      await adminApproveUser(userId, { plan_type: 'free', initial_tokens: 100 })
      toast.success('Kullanıcı onaylandı')
      loadData()
    } catch (error) {
      toast.error('Onaylama başarısız')
    }
  }

  const handleReject = async (userId) => {
    if (!confirm('Kullanıcıyı reddetmek istediğinizden emin misiniz?')) return
    try {
      await adminRejectUser(userId)
      toast.success('Kullanıcı reddedildi')
      loadData()
    } catch (error) {
      toast.error('Reddetme başarısız')
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return
    try {
      await adminDeleteUser(userId)
      toast.success('Kullanıcı silindi')
      loadData()
    } catch (error) {
      toast.error('Silme başarısız')
    }
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
            <Shield className="w-6 h-6 text-indigo-400" />
            Admin Paneli
          </h1>
          <p className="text-slate-400">Kullanıcı yönetimi ve sistem istatistikleri</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Toplam Kullanıcı"
            value={stats.total_users}
            icon={Users}
            color="purple"
            delay={0}
          />
          <StatCard
            title="Bekleyen Onay"
            value={stats.pending_users}
            icon={Clock}
            color="amber"
            delay={0.1}
          />
          <StatCard
            title="Toplam Bot"
            value={stats.total_bots}
            icon={Bot}
            color="blue"
            delay={0.2}
          />
          <StatCard
            title="Toplam Grup"
            value={stats.total_groups}
            icon={MessageSquare}
            color="emerald"
            delay={0.3}
          />
        </div>
      )}

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2"
      >
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-[#16162a] text-slate-400 hover:bg-indigo-500/20 hover:text-indigo-300'
            }`}
          >
            {status === 'all' ? 'Tümü' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-indigo-500/10">
                <th className="text-left p-4 text-slate-400 font-medium text-sm">Kullanıcı</th>
                <th className="text-left p-4 text-slate-400 font-medium text-sm">Durum</th>
                <th className="text-left p-4 text-slate-400 font-medium text-sm">Plan</th>
                <th className="text-left p-4 text-slate-400 font-medium text-sm">Token</th>
                <th className="text-left p-4 text-slate-400 font-medium text-sm">Kayıt Tarihi</th>
                <th className="text-right p-4 text-slate-400 font-medium text-sm">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr
                  key={user.id}
                  className="border-b border-indigo-500/10 hover:bg-indigo-500/5 transition-colors"
                >
                  <td className="p-4">
                    <div>
                      <div className="text-white font-medium">{user.username}</div>
                      <div className="text-slate-500 text-sm">{user.email}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[user.approval_status]}`}
                    >
                      {user.approval_status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${planColors[user.plan_type]}`}
                    >
                      {user.plan_type}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-white font-medium">{user.tokens}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-400 text-sm">
                      {new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {user.approval_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(user.id)}
                            className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                            title="Onayla"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(user.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            title="Reddet"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Kullanıcı bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
