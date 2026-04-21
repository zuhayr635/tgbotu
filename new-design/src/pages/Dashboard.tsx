import { motion } from 'framer-motion';
import {
  Send,
  Users,
  Radio,
  MessageSquare,
  TrendingUp,
  Zap,
  Clock,
  BarChart3,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import BroadcastCard from '../components/BroadcastCard';
import { mockStats, mockBroadcasts } from '../data/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const chartData = [
  { name: 'Pzt', gonderilen: 4500, basarili: 4200 },
  { name: 'Sal', gonderilen: 5200, basarili: 4900 },
  { name: 'Çar', gonderilen: 4800, basarili: 4600 },
  { name: 'Per', gonderilen: 6100, basarili: 5800 },
  { name: 'Cum', gonderilen: 7200, basarili: 6900 },
  { name: 'Cmt', gonderilen: 5400, basarili: 5200 },
  { name: 'Paz', gonderilen: 6300, basarili: 6000 },
];

const activityData = [
  { time: '09:00', mesaj: 120 },
  { time: '10:00', mesaj: 350 },
  { time: '11:00', mesaj: 480 },
  { time: '12:00', mesaj: 620 },
  { time: '13:00', mesaj: 450 },
  { time: '14:00', mesaj: 580 },
  { time: '15:00', mesaj: 720 },
  { time: '16:00', mesaj: 650 },
  { time: '17:00', mesaj: 480 },
];

export default function Dashboard() {
  const activeBroadcasts = mockBroadcasts.filter(b => b.status === 'active');

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Gösterge Paneli</h1>
          <p className="text-slate-400">Sistem genel bakışı ve istatistikler</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="w-4 h-4" />
          <span>Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Toplam Yayın"
          value={mockStats.totalBroadcasts}
          change={12.5}
          changeLabel="Geçen aya göre"
          icon={Send}
          color="indigo"
          delay={0}
        />
        <StatCard
          title="Aktif Yayınlar"
          value={mockStats.activeBroadcasts}
          icon={Radio}
          color="emerald"
          delay={0.1}
        />
        <StatCard
          title="Toplam Gruplar"
          value={mockStats.totalGroups}
          change={8.3}
          changeLabel="Geçen aya göre"
          icon={Users}
          color="purple"
          delay={0.2}
        />
        <StatCard
          title="Gönderilen Mesaj"
          value={mockStats.messagesSent.toLocaleString()}
          change={23.8}
          changeLabel="Geçen aya göre"
          icon={MessageSquare}
          color="cyan"
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Gönderim İstatistikleri
              </h3>
              <p className="text-sm text-slate-400">Son 7 gün gönderim performansı</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-slate-400">Gönderilen</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-400">Başarılı</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGonderilen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBasarili" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e1e3a', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="gonderilen" stroke="#6366f1" fillOpacity={1} fill="url(#colorGonderilen)" strokeWidth={2} />
                <Area type="monotone" dataKey="basarili" stroke="#10b981" fillOpacity={1} fill="url(#colorBasarili)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6"
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Günülük Aktivite
            </h3>
            <p className="text-sm text-slate-400">Saatlik mesaj gönderim hızı</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e1e3a', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line type="monotone" dataKey="mesaj" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Active Broadcasts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400" />
            Aktif Yayınlar
          </h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            Tümünü Gör
            <TrendingUp className="w-4 h-4" />
          </motion.button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeBroadcasts.map((broadcast, index) => (
            <BroadcastCard key={broadcast.id} broadcast={broadcast} delay={0.7 + index * 0.1} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
