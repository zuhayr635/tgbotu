import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  Download,
  RefreshCw,
  Users,
  Lock,
  Globe,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { mockGroups } from '../data/mockData';
import GroupCard from '../components/GroupCard';
import { Group } from '../types';

const categories = ['Tümü', 'Destek', 'Duyuru', 'VIP', 'Pazarlama', 'Eğitim', 'Test', 'Kurumsal', 'Bülten', 'Topluluk'];

export default function Groups() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedType, setSelectedType] = useState<'all' | 'public' | 'private'>('all');

  const filteredGroups = mockGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tümü' || group.category === selectedCategory;
    const matchesType = selectedType === 'all' || group.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const totalMembers = filteredGroups.reduce((sum, g) => sum + g.memberCount, 0);

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            Grup Yönetimi
          </h1>
          <p className="text-slate-400 mt-1">Toplam {mockGroups.length} grup, {totalMembers.toLocaleString()} üye</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl btn-gradient text-white font-medium shadow-lg shadow-indigo-500/30"
        >
          <Plus className="w-5 h-5" />
          Yeni Grup Ekle
        </motion.button>
      </motion.div>

      {/* Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Grup ara..."
            className="w-full bg-[#1e1e3a] border border-indigo-500/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 input-focus transition-all duration-300"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 bg-[#1e1e3a] border border-indigo-500/20 rounded-xl px-4 py-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 bg-[#1e1e3a] rounded-xl p-1 border border-indigo-500/20">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedType === 'all' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setSelectedType('public')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedType === 'public' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-1" />
            Açık
          </button>
          <button
            onClick={() => setSelectedType('private')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedType === 'private' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4 inline mr-1" />
            Gizli
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-[#1e1e3a] rounded-xl p-1 border border-indigo-500/20">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-xl bg-[#1e1e3a] border border-indigo-500/20 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40 transition-all"
          >
            <Download className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-xl bg-[#1e1e3a] border border-indigo-500/20 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-slate-400"
      >
        {filteredGroups.length} sonuç bulundu
      </motion.div>

      {/* Groups Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group, index) => (
            <GroupCard key={group.id} group={group} delay={0.1 * index} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 overflow-hidden"
        >
          <table className="w-full">
            <thead className="bg-[#16162a] border-b border-indigo-500/10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Grup</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Kategori</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Üyeler</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Tür</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Durum</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-slate-400">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group, index) => (
                <motion.tr
                  key={group.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="border-b border-indigo-500/10 hover:bg-indigo-500/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        group.type === 'public' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {group.type === 'public' ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-white">{group.name}</p>
                        <p className="text-xs text-slate-500">{group.createdAt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300">
                      {group.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">{group.memberCount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-sm ${
                      group.type === 'public' ? 'text-emerald-400' : 'text-purple-400'
                    }`}>
                      {group.type === 'public' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      {group.type === 'public' ? 'Açık' : 'Gizli'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-sm ${
                      group.isActive ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${group.isActive ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-500'}`} />
                      {group.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Empty State */}
      {filteredGroups.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Sonuç Bulunamadı</h3>
          <p className="text-slate-400">Arama kriterlerinize uygun grup bulunamadı.</p>
        </motion.div>
      )}
    </div>
  );
}
