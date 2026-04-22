import { motion } from 'framer-motion'
import { History } from 'lucide-react'

export default function HistoryPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-80 sm:min-h-96 bg-[#1e1e3a] rounded-xl sm:rounded-2xl border border-indigo-500/20 p-6 sm:p-8"
    >
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-3 sm:mb-4">
        <History className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Gönderim Geçmişi</h3>
      <p className="text-slate-400 text-center text-sm sm:text-base">Bu sayfa yapım aşamasındadır.</p>
    </motion.div>
  )
}
