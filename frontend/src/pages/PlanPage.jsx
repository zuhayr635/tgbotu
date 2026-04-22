import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { getPlanInfo, getTokenInfo } from '../lib/api'
import toast from 'react-hot-toast'
import {
  CreditCard,
  TrendingUp,
  Zap,
  Calendar,
  Check,
  ArrowRight,
} from 'lucide-react'
import StatCard from '../components/StatCard'

const planFeatures = {
  free: {
    name: 'Ücretsiz',
    color: 'slate',
    price: '₺0',
    period: 'her zaman',
    features: [
      '1 Bot',
      '5 Grup',
      '100 Token / dönem',
      'Temel özellikler',
    ],
  },
  weekly: {
    name: 'Haftalık',
    color: 'blue',
    price: '₺49',
    period: 'haftalık',
    features: [
      '3 Bot',
      '25 Grup',
      '1000 Token / dönem',
      'Öncelikli destek',
      'Gelişmiş raporlama',
    ],
  },
  monthly: {
    name: 'Aylık',
    color: 'purple',
    price: '₺149',
    period: 'aylık',
    features: [
      'Sınırsız Bot',
      'Sınırsız Grup',
      '5000 Token / dönem',
      '7/24 Destek',
      'Gelişmiş raporlama',
      'API erişimi',
      'Özel entegrasyonlar',
    ],
  },
}

const planColors = {
  free: 'from-slate-600 to-slate-700',
  weekly: 'from-blue-600 to-blue-700',
  monthly: 'from-purple-600 to-purple-700',
}

export default function PlanPage() {
  const { t } = useTranslation()
  const [planInfo, setPlanInfo] = useState(null)
  const [tokenInfo, setTokenInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const [planRes, tokenRes] = await Promise.all([
        getPlanInfo(),
        getTokenInfo(),
      ])
      setPlanInfo(planRes.data)
      setTokenInfo(tokenRes.data)
    } catch (error) {
      toast.error('Bilgiler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm">Yükleniyor...</div>
      </div>
    )
  }

  const currentPlan = planFeatures[planInfo?.plan_type || 'free']
  const tokenPercentage = tokenInfo?.tokens_per_period 
    ? Math.round((tokenInfo.tokens_used_period / tokenInfo.tokens_per_period) * 100)
    : 0

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
            Plan & Üyelik
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">Mevcut planınız ve kullanım istatistikleri</p>
        </div>
      </motion.div>

      {/* Current Plan Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <StatCard
          title="Mevcut Plan"
          value={currentPlan.name}
          icon={CreditCard}
          color="purple"
          delay={0}
        />
        <StatCard
          title="Token Bakiyesi"
          value={tokenInfo?.current_balance || 0}
          icon={Zap}
          color="amber"
          delay={0.1}
        />
        <StatCard
          title="Kullanım Oranı"
          value={`${tokenPercentage}%`}
          icon={TrendingUp}
          color="emerald"
          delay={0.2}
        />
      </div>

      {/* Current Plan Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1e1e3a] rounded-xl sm:rounded-2xl border border-indigo-500/20 p-4 sm:p-6"
      >
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          Mevcut Plan Detayları
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#16162a] rounded-xl p-3 sm:p-4">
            <div className="text-slate-400 text-xs sm:text-sm mb-1">Plan Tipi</div>
            <div className="text-white font-semibold text-sm sm:text-base">{currentPlan.name}</div>
          </div>
          <div className="bg-[#16162a] rounded-xl p-3 sm:p-4">
            <div className="text-slate-400 text-xs sm:text-sm mb-1">Maksimum Bot</div>
            <div className="text-white font-semibold text-sm sm:text-base">{planInfo?.max_bots || 1}</div>
          </div>
          <div className="bg-[#16162a] rounded-xl p-3 sm:p-4">
            <div className="text-slate-400 text-xs sm:text-sm mb-1">Maksimum Grup</div>
            <div className="text-white font-semibold text-sm sm:text-base">{planInfo?.max_groups || 5}</div>
          </div>
          <div className="bg-[#16162a] rounded-xl p-3 sm:p-4">
            <div className="text-slate-400 text-xs sm:text-sm mb-1">Token / Dönem</div>
            <div className="text-white font-semibold text-sm sm:text-base">{planInfo?.tokens_per_period || 100}</div>
          </div>
        </div>
      </motion.div>

      {/* Token Usage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1e1e3a] rounded-xl sm:rounded-2xl border border-indigo-500/20 p-4 sm:p-6"
      >
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          Token Kullanımı
        </h2>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="text-slate-400">Bu Dönem Kullanılan</span>
              <span className="text-white font-medium">
                {tokenInfo?.tokens_used_period || 0} / {tokenInfo?.tokens_per_period || 100}
              </span>
            </div>
            <div className="h-2 sm:h-3 bg-[#16162a] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(tokenPercentage, 100)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-400">Mevcut Bakiye</span>
            <span className="text-white font-semibold">{tokenInfo?.current_balance || 0} Token</span>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              Son Sıfırlama
            </span>
            <span className="text-white">
              {tokenInfo?.last_reset 
                ? new Date(tokenInfo.last_reset).toLocaleDateString('tr-TR')
                : '-'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Upgrade Plans */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Plan Yükselt</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {Object.entries(planFeatures).map(([key, plan]) => {
            const isCurrent = key === (planInfo?.plan_type || 'free')
            return (
              <motion.div
                key={key}
                whileHover={{ y: -5 }}
                className={`relative rounded-xl sm:rounded-2xl overflow-hidden ${
                  isCurrent ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                <div className={`bg-gradient-to-br ${planColors[key]} p-4 sm:p-6`}>
                  {isCurrent && (
                    <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full text-xs font-medium text-white">
                      Mevcut
                    </div>
                  )}
                  <div className="text-white/80 text-xs sm:text-sm font-medium mb-1">{plan.name}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{plan.price}</div>
                  <div className="text-white/60 text-xs sm:text-sm mb-3 sm:mb-4">{plan.period}</div>
                  <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-white/90 text-xs sm:text-sm">
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <button className="w-full py-2 sm:py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm">
                      Yükselt
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Payment History Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#1e1e3a] rounded-xl sm:rounded-2xl border border-indigo-500/20 p-4 sm:p-6"
      >
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Ödeme Geçmişi</h2>
        <div className="text-center py-6 sm:py-8 text-slate-400">
          <CreditCard className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
          <p className="text-sm sm:text-base">Henüz ödeme geçmişi bulunmuyor</p>
          <p className="text-xs sm:text-sm mt-1">Plan yükselttiğinizde burada görünecektir</p>
        </div>
      </motion.div>
    </div>
  )
}
