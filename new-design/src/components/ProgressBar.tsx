import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  status: 'active' | 'completed' | 'pending' | 'failed';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const statusColors = {
  active: 'from-indigo-500 to-purple-500',
  completed: 'from-emerald-500 to-emerald-400',
  pending: 'from-amber-500 to-amber-400',
  failed: 'from-rose-500 to-rose-400',
};

export default function ProgressBar({ progress, status, size = 'md', showPercentage = true }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className={`w-full ${sizeClasses[size]} bg-slate-700/50 rounded-full overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          className={`h-full rounded-full bg-gradient-to-r ${statusColors[status]} progress-bar`}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between mt-2">
          <span className="text-xs text-slate-400">%{progress}</span>
          <span className="text-xs text-slate-500">{progress === 100 ? 'Tamamlandı' : 'Devam ediyor'}</span>
        </div>
      )}
    </div>
  );
}
