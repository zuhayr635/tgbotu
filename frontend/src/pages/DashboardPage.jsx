import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { getDashboard, cleanupStorage, getPlanInfo, getTokenInfo } from '../lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import StatCard from '../components/StatCard'
import { Send, Radio, Users, MessageSquare, BarChart3, Zap, Clock, TrendingUp, CreditCard } from 'lucide-react'

const statusColor = {
  completed: '#22c55e',
  running: '#6366f1',
  failed: '#ef4444',
  pending: '#f59e0b',
  cancelled: '#475569'
}

const statusBg = {
  completed: 'rgba(34,197,94,0.1)',
  running: 'rgba(99,102,241,0.1)',
  failed: 'rgba(239,68,68,0.1)',
  pending: 'rgba(245,158,11,0.1)',
  cancelled: 'rgba(71,85,105,0.1)'
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [planInfo, setPlanInfo] = useState(null)
  const [tokenInfo, setTokenInfo] = useState(null)

  const load = async () => {
    try {
      const [dashRes, planRes, tokenRes] = await Promise.all([
        getDashboard(),
        getPlanInfo().catch(() => null),
        getTokenInfo().catch(() => null),
      ])
      setData(dashRes.data)
      if (planRes) setPlanInfo(planRes.data)
      if (tokenRes) setTokenInfo(tokenRes.data)
    } catch { toast.error('Yuklenemedi') }
  }

  useEffect(() => { load() }, [])

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-slate-400 text-sm">Yukleniyor...</div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">{t('dashboard.title')}</h1>
          <p className="text-slate-400">Sistem genel bakışı ve istatistikler</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="w-4 h-4" />
          <span>Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}</span>
        </div>
      </motion.div>

      {/* Storage Warning */}
      {data.storage_warning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-amber-300 text-sm">
              {t('dashboard.storageWarning', { mb: data.storage_mb })}
            </span>
          </div>
          <button
            onClick={async () => {
              if (!confirm('Tum yuklü medya dosyalari silinecek. Emin misiniz?')) return
              await cleanupStorage()
              toast.success('Depolama temizlendi')
              load()
            }}
            className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors text-sm font-medium"
          >
            {t('dashboard.cleanupStorage')}
          </button>
        </motion.div>
      )}

      {/* Plan & Token Info */}
      {(planInfo || tokenInfo) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-slate-400 text-sm">Mevcut Plan</div>
                <div className="text-white font-semibold">
                  {planInfo?.plan_type === 'free' ? 'Ücretsiz' :
                   planInfo?.plan_type === 'weekly' ? 'Haftalık' :
                   planInfo?.plan_type === 'monthly' ? 'Aylık' : 'Ücretsiz'}
                </div>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-slate-500">Max Bot:</span>
                <span className="text-white ml-1">{planInfo?.max_bots || 1}</span>
              </div>
              <div>
                <span className="text-slate-500">Max Grup:</span>
                <span className="text-white ml-1">{planInfo?.max_groups || 5}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-slate-400 text-sm">Token Bakiyesi</div>
                <div className="text-white font-semibold">{tokenInfo?.current_balance || 0}</div>
              </div>
            </div>
            <div className="text-sm text-slate-400">
              Bu Dönem: {tokenInfo?.tokens_used_period || 0} / {tokenInfo?.tokens_per_period || 100}
            </div>
          </div>

          <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-slate-400 text-sm">Kota Kullanımı</div>
                <div className="text-white font-semibold">
                  {tokenInfo?.tokens_per_period
                    ? Math.round((tokenInfo.tokens_used_period / tokenInfo.tokens_per_period) * 100)
                    : 0}%
                </div>
              </div>
            </div>
            <div className="h-2 bg-[#16162a] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    tokenInfo?.tokens_per_period
                      ? (tokenInfo.tokens_used_period / tokenInfo.tokens_per_period) * 100
                      : 0,
                    100
                  )}%`
                }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('dashboard.totalGroups')}
          value={data.total_groups}
          icon={Users}
          color="purple"
          delay={0}
        />
        <StatCard
          title={t('dashboard.todayBroadcasts')}
          value={data.today_broadcasts}
          icon={Send}
          color="emerald"
          delay={0.1}
        />
        <StatCard
          title={t('dashboard.pendingTasks')}
          value={data.pending_tasks}
          icon={Clock}
          color="amber"
          delay={0.2}
        />
        <StatCard
          title={t('dashboard.botStatus')}
          value={data.bot_running ? t('dashboard.botRunning') : t('dashboard.botStopped')}
          icon={Radio}
          color={data.bot_running ? 'emerald' : 'rose'}
          delay={0.3}
        />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Broadcasts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              {t('dashboard.recentBroadcasts')}
            </h3>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              Tümünü Gör
              <TrendingUp className="w-4 h-4" />
            </motion.button>
          </div>
          {data.recent_broadcasts.length === 0
            ? <p className="text-slate-400 text-sm">{t('dashboard.noRecent')}</p>
            : data.recent_broadcasts.map(b => (
              <div key={b.id} className="p-3 rounded-xl bg-[#16162a]/50 border border-indigo-500/10 mb-2 last:mb-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 truncate mb-1">
                      {b.message_preview || '(medya)'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {b.sent_count}/{b.total_groups} grup — {b.created_at ? format(new Date(b.created_at), 'dd.MM HH:mm') : ''}
                    </div>
                  </div>
                  <span
                    className="text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider ml-3"
                    style={{ background: statusBg[b.status], color: statusColor[b.status] }}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))
          }
        </motion.div>

        {/* Upcoming Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              {t('dashboard.upcomingTasks')}
            </h3>
          </div>
          {data.upcoming_tasks.length === 0
            ? <p className="text-slate-400 text-sm">{t('dashboard.noUpcoming')}</p>
            : data.upcoming_tasks.map(task => (
              <div key={task.id} className="p-3 rounded-xl bg-[#16162a]/50 border border-indigo-500/10 mb-2 last:mb-0">
                <div className="text-sm text-slate-200 truncate mb-1">
                  {task.message_preview || '(medya)'}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {task.target_count} grup
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(task.run_at), 'dd.MM.yyyy HH:mm')}
                  </div>
                </div>
              </div>
            ))
          }
        </motion.div>
      </div>
    </div>
  )
}
