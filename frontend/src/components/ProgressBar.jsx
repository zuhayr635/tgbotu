import { motion } from 'framer-motion'

export default function ProgressBar({ progress, status = 'active' }) {
  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'from-indigo-500 to-purple-500'
      case 'completed': return 'from-emerald-500 to-green-500'
      case 'failed': return 'from-rose-500 to-red-500'
      case 'pending': return 'from-amber-500 to-yellow-500'
      default: return 'from-indigo-500 to-purple-500'
    }
  }

  return (
    <div className="relative">
      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${getStatusColor()} rounded-full progress-bar`}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-slate-500">İlerleme</span>
        <span className="text-xs font-medium text-slate-300">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}
