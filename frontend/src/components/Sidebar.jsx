import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Send,
  Users,
  Radio,
  Settings,
  MessageCircle,
  LogOut,
  Shield,
  CreditCard,
  Bot,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getMe } from '../lib/api'
import { useEffect, useState } from 'react'

const menuItems = [
  { id: 'dashboard', label: 'Gösterge Paneli', icon: LayoutDashboard },
  { id: 'broadcast', label: 'Yeni Yayın', icon: Send },
  { id: 'groups', label: 'Gruplar', icon: Users },
  { id: 'active', label: 'Aktif Yayınlar', icon: Radio },
  { id: 'bots', label: 'Bot Yönetimi', icon: Bot },
  { id: 'plan', label: 'Plan & Üyelik', icon: CreditCard },
  { id: 'settings', label: 'Ayarlar', icon: Settings },
]

const adminMenuItems = [
  { id: 'admin', label: 'Admin Paneli', icon: Shield },
]

export default function Sidebar({ currentPage, onPageChange, onLogout }) {
  const { t, i18n } = useTranslation()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    getMe().then(res => {
      setIsAdmin(res.data.is_admin)
    }).catch(() => setIsAdmin(false))
  }, [])

  const items = isAdmin ? [...menuItems, ...adminMenuItems] : menuItems

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 h-full w-72 bg-[#16162a] border-r border-indigo-500/20 flex flex-col z-50"
    >
      {/* Logo */}
      <div className="p-6 border-b border-indigo-500/10">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">TG Panel</h1>
            <p className="text-xs text-slate-400">Broadcast Manager</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {items.map((item, index) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index + 0.3 }}
              >
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'group-hover:text-indigo-400'}`} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 rounded-full bg-white"
                    />
                  )}
                </button>
              </motion.li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-indigo-500/10 space-y-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => i18n.changeLanguage(i18n.language === 'tr' ? 'en' : 'tr')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all duration-300"
        >
          <span className="text-sm font-medium">
            {i18n.language === 'tr' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
          </span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Çıkış Yap</span>
        </motion.button>
      </div>
    </motion.aside>
  )
}
