import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Pause,
  Play,
  Square,
  RotateCcw,
  Trash2,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  MoreVertical,
  BarChart3,
} from 'lucide-react';
import { mockBroadcasts } from '../data/mockData';
import { Broadcast } from '../types';
import ProgressBar from '../components/ProgressBar';

export default function ActiveBroadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(mockBroadcasts);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'completed' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Simulate progress updates for active broadcasts
  useEffect(() => {
    const interval = setInterval(() => {
      setBroadcasts(prev => prev.map(b => {
        if (b.status === 'active' && b.progress < 100) {
          const newProgress = Math.min(b.progress + Math.random() * 2, 100);
          return {
            ...b,
            progress: newProgress,
            sentCount: Math.floor(b.totalRecipients * (newProgress / 100)),
          };
        }
        return b;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const filteredBroadcasts = broadcasts.filter(b => {
    const matchesFilter = filter === 'all' || b.status === filter;
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    active: broadcasts.filter(b => b.status === 'active').length,
    pending: broadcasts.filter(b => b.status === 'pending').length,
    completed: broadcasts.filter(b => b.status === 'completed').length,
    failed: broadcasts.filter(b => b.status === 'failed').length,
  };

  const handlePause = (id: string) => {
    setBroadcasts(prev => prev.map(b => 
      b.id === id ? { ...b, status: 'pending' } : b
    ));
  };

  const handleResume = (id: string) => {
    setBroadcasts(prev => prev.map(b => 
      b.id === id ? { ...b, status: 'active' } : b
    ));
  };

  const handleStop = (id: string) => {
    setBroadcasts(prev => prev.map(b => 
      b.id === id ? { ...b, status: 'completed' } : b
    ));
  };

  const handleDelete = (id: string) => {
    setBroadcasts(prev => prev.filter(b => b.id !== id));
  };

  const getStatusIcon = (status: Broadcast['status']) => {
    switch (status) {
      case 'active': return <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />;
      case 'pending': return <Clock className="w-5 h-5 text-amber-400" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'failed': return <XCircle className="w-5 h-5 text-rose-400" />;
    }
  };

  const getStatusLabel = (status: Broadcast['status']) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'pending': return 'Beklemede';
      case 'completed': return 'Tamamlandı';
      case 'failed': return 'Başarısız';
    }
  };

  const getStatusColor = (status: Broadcast['status']) => {
    switch (status) {
      case 'active': return 'text-indigo-400 bg-indigo-500/20';
      case 'pending': return 'text-amber-400 bg-amber-500/20';
      case 'completed': return 'text-emerald-400 bg-emerald-500/20';
      case 'failed': return 'text-rose-400 bg-rose-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            Aktif Yayınlar
          </h1>
          <p className="text-slate-400 mt-1">Yayınlarınızı izleyin ve yönetin</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <BarChart3 className="w-4 h-4" />
          <span>Güncelleniyor...</span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Aktif', value: stats.active, color: 'indigo', icon: Radio },
          { label: 'Beklemede', value: stats.pending, color: 'amber', icon: Clock },
          { label: 'Tamamlandı', value: stats.completed, color: 'emerald', icon: CheckCircle },
          { label: 'Başarısız', value: stats.failed, color: 'rose', icon: XCircle },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            onClick={() => setFilter(stat.label.toLowerCase() as any)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              filter === stat.label.toLowerCase()
                ? `bg-${stat.color}-500/20 border-${stat.color}-500`
                : 'bg-[#1e1e3a] border-indigo-500/20 hover:border-indigo-500/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${stat.color}-500/20`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Yayın ara..."
            className="w-full bg-[#1e1e3a] border border-indigo-500/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 input-focus transition-all duration-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-[#1e1e3a] border border-indigo-500/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none cursor-pointer"
          >
            <option value="all">Tümü</option>
            <option value="active">Aktif</option>
            <option value="pending">Beklemede</option>
            <option value="completed">Tamamlandı</option>
            <option value="failed">Başarısız</option>
          </select>
        </div>
      </motion.div>

      {/* Broadcasts List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredBroadcasts.map((broadcast, index) => (
            <motion.div
              key={broadcast.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: 0.05 * index }}
              className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(broadcast.status)}`}>
                    {getStatusIcon(broadcast.status)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{broadcast.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-1">{broadcast.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>Oluşturulma: {broadcast.createdAt}</span>
                      {broadcast.scheduledFor && (
                        <span className="text-amber-400">Planlanan: {broadcast.scheduledFor}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {broadcast.status === 'active' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePause(broadcast.id)}
                        className="p-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                      >
                        <Pause className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStop(broadcast.id)}
                        className="p-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                      >
                        <Square className="w-5 h-5" />
                      </motion.button>
                    </>
                  )}
                  {broadcast.status === 'pending' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleResume(broadcast.id)}
                      className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                    >
                      <Play className="w-5 h-5" />
                    </motion.button>
                  )}
                  {broadcast.status === 'failed' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(broadcast.id)}
                    className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <ProgressBar progress={broadcast.progress} status={broadcast.status} />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-400">Toplam:</span>
                  <span className="text-white font-medium">{broadcast.totalRecipients.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-400">Gönderildi:</span>
                  <span className="text-white font-medium">{broadcast.sentCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-slate-400">Başarısız:</span>
                  <span className="text-white font-medium">{broadcast.failedCount}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredBroadcasts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Yayın Bulunamadı</h3>
          <p className="text-slate-400">Seçilen filtreye uygun yayın bulunmuyor.</p>
        </motion.div>
      )}
    </div>
  );
}
