import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  color: 'indigo' | 'purple' | 'emerald' | 'amber' | 'rose' | 'cyan';
  delay?: number;
}

const colorVariants = {
  indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30',
  purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
  amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
  rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30',
  cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
};

const iconColors = {
  indigo: 'text-indigo-400 bg-indigo-500/20',
  purple: 'text-purple-400 bg-purple-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/20',
  amber: 'text-amber-400 bg-amber-500/20',
  rose: 'text-rose-400 bg-rose-500/20',
  cyan: 'text-cyan-400 bg-cyan-500/20',
};

export default function StatCard({ title, value, change, changeLabel, icon: Icon, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorVariants[color]} border p-6 card-hover`}
    >
      {/* Background Glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${iconColors[color]} flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{change > 0 ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {changeLabel && (
            <p className="text-slate-500 text-xs mt-2">{changeLabel}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
