import { motion } from 'framer-motion';
import { Bell, Search, User, ChevronDown } from 'lucide-react';

export default function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-16 bg-[#16162a]/80 backdrop-blur-md border-b border-indigo-500/10 px-6 flex items-center justify-between sticky top-0 z-40"
    >
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Ara..."
          className="w-64 bg-[#1e1e3a] border border-indigo-500/20 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 input-focus transition-all duration-300"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-xl bg-[#1e1e3a] border border-indigo-500/20 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40 transition-all duration-300"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-600 rounded-full text-xs text-white flex items-center justify-center font-bold">
            3
          </span>
        </motion.button>

        {/* User Profile */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#1e1e3a] border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-slate-200">Admin</p>
            <p className="text-xs text-slate-500">admin@sirketim.com</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.button>
      </div>
    </motion.header>
  );
}
