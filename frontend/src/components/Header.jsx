import { motion } from 'framer-motion'
import { Bell, User, ChevronDown } from 'lucide-react'
import { HamburgerButton } from './Sidebar'

export default function Header({ onMenuClick }) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-14 sm:h-16 bg-[#16162a]/80 backdrop-blur-md border-b border-indigo-500/10 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40"
    >
      {/* Left Section - Hamburger & Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        <HamburgerButton onClick={onMenuClick} />
        <div className="relative hidden sm:block">
          <input
            type="text"
            placeholder="Ara..."
            className="w-48 md:w-64 bg-[#1e1e3a] border border-indigo-500/20 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 input-focus transition-all duration-300"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-1.5 sm:p-2 rounded-xl bg-[#1e1e3a] border border-indigo-500/20 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40 transition-all duration-300"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        </motion.button>

        {/* User Profile */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#1e1e3a] border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-slate-200">Admin</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
        </motion.button>
      </div>
    </motion.header>
  )
}
