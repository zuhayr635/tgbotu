import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'

export default function SchedulesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-96 bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-8"
    >
      <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-indigo-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Zamanlanmış Görevler</h3>
      <p className="text-slate-400 text-center">Bu sayfa yapım aşamasındadır.</p>
    </motion.div>
  )
}
