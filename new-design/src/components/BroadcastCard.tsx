import { motion } from 'framer-motion';
import { Clock, Users, CheckCircle, XCircle, Send } from 'lucide-react';
import { Broadcast } from '../types';
import ProgressBar from './ProgressBar';

interface BroadcastCardProps {
  broadcast: Broadcast;
  delay?: number;
}

const statusConfig = {
  active: { label: 'Aktif', color: 'text-indigo-400 bg-indigo-500/20', icon: Send },
  completed: { label: 'Tamamlandı', color: 'text-emerald-400 bg-emerald-500/20', icon: CheckCircle },
  pending: { label: 'Beklemede', color: 'text-amber-400 bg-amber-500/20', icon: Clock },
  failed: { label: 'Başarısız', color: 'text-rose-400 bg-rose-500/20', icon: XCircle },
};

export default function BroadcastCard({ broadcast, delay = 0 }: BroadcastCardProps) {
  const status = statusConfig[broadcast.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6 card-hover"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">{broadcast.title}</h3>
          <p className="text-sm text-slate-400 line-clamp-1">{broadcast.message}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.color}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{status.label}</span>
        </div>
      </div>

      {/* Progress */}
      {broadcast.status === 'active' && (
        <div className="mb-4">
          <ProgressBar progress={broadcast.progress} status={broadcast.status} />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 rounded-xl bg-slate-800/50">
          <Users className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{broadcast.totalRecipients.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Toplam</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-slate-800/50">
          <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{broadcast.sentCount.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Gönderildi</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-slate-800/50">
          <XCircle className="w-4 h-4 text-rose-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{broadcast.failedCount}</p>
          <p className="text-xs text-slate-500">Başarısız</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Oluşturulma: {broadcast.createdAt}</span>
        {broadcast.scheduledFor && (
          <span className="text-amber-400">Planlanan: {broadcast.scheduledFor}</span>
        )}
      </div>
    </motion.div>
  );
}
