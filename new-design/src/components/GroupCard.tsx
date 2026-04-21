import { motion } from 'framer-motion';
import { Users, Lock, Globe, Calendar, Activity, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Group } from '../types';
import { useState } from 'react';

interface GroupCardProps {
  group: Group;
  delay?: number;
  onSelect?: (group: Group) => void;
  isSelected?: boolean;
}

export default function GroupCard({ group, delay = 0, onSelect, isSelected }: GroupCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4 }}
      onClick={() => onSelect?.(group)}
      className={`relative bg-[#1e1e3a] rounded-2xl border p-5 card-hover cursor-pointer ${
        isSelected ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-indigo-500/20'
      }`}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            group.type === 'public' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
          }`}>
            {group.type === 'public' ? <Globe className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-semibold text-white line-clamp-1">{group.name}</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300">
              {group.category}
            </span>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-full mt-2 w-40 bg-[#16162a] border border-indigo-500/20 rounded-xl shadow-xl z-10 py-2"
            >
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors">
                <Edit2 className="w-4 h-4" />
                Düzenle
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                <Trash2 className="w-4 h-4" />
                Sil
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Users className="w-4 h-4 text-indigo-400" />
          <span>{group.memberCount.toLocaleString()} üye</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Calendar className="w-4 h-4 text-purple-400" />
          <span>{group.createdAt}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>{group.lastActivity}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${group.isActive ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-500'}`} />
          <span className="text-sm text-slate-400">{group.isActive ? 'Aktif' : 'Pasif'}</span>
        </div>
      </div>
    </motion.div>
  );
}
