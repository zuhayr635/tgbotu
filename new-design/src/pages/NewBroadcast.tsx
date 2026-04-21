import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Users,
  Clock,
  Image as ImageIcon,
  Smile,
  Link,
  Bold,
  Italic,
  Underline,
  List,
  Hash,
  ChevronDown,
  Check,
  Calendar,
} from 'lucide-react';
import { mockGroups } from '../data/mockData';
import { Group } from '../types';

export default function NewBroadcast() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const totalRecipients = mockGroups
    .filter(g => selectedGroups.includes(g.id))
    .reduce((sum, g) => sum + g.memberCount, 0);

  const handleSubmit = () => {
    alert('Yayın oluşturuldu!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            Yeni Yayın Oluştur
          </h1>
          <p className="text-slate-400 mt-1">Yeni bir toplu mesaj yayını planlayın</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Composer */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Title Input */}
          <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Yayın Başlığı</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Yayın için bir başlık girin..."
              className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 input-focus transition-all duration-300"
            />
          </div>

          {/* Message Composer */}
          <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-4 py-3 border-b border-indigo-500/10 bg-[#16162a]/50">
              <motion.button whileHover={{ scale: 1.1 }} className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                <Bold className="w-4 h-4" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                <Italic className="w-4 h-4" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                <Underline className="w-4 h-4" />
              </motion.button>
              <div className="w-px h-6 bg-indigo-500/20 mx-2" />
              <motion.button whileHover={{ scale: 1.1 }} className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                <List className="w-4 h-4" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                <Hash className="w-4 h-4" />
              </motion.button>
              <div className="w-px h-6 bg-indigo-500/20 mx-2" />
              <motion.button whileHover={{ scale: 1.1 }} className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                <Link className="w-4 h-4" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                <ImageIcon className="w-4 h-4" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                <Smile className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Text Area */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mesajınızı buraya yazın... Markdown desteklenmektedir."
              rows={10}
              className="w-full bg-[#16162a] px-4 py-4 text-white placeholder-slate-500 resize-none focus:outline-none"
            />

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-indigo-500/10 bg-[#16162a]/50">
              <span className="text-sm text-slate-500">{message.length} karakter</span>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                  className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Önizleme
                </motion.button>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
            <label className="block text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Zamanlama
            </label>
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setScheduleType('now')}
                className={`flex-1 flex items-center justify-center gap-3 px-4 py-4 rounded-xl border transition-all duration-300 ${
                  scheduleType === 'now'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-indigo-500/20 text-slate-400 hover:border-indigo-500/40'
                }`}
              >
                <Send className="w-5 h-5" />
                <span className="font-medium">Şimdi Gönder</span>
                {scheduleType === 'now' && <Check className="w-5 h-5 ml-2" />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setScheduleType('later')}
                className={`flex-1 flex items-center justify-center gap-3 px-4 py-4 rounded-xl border transition-all duration-300 ${
                  scheduleType === 'later'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-indigo-500/20 text-slate-400 hover:border-indigo-500/40'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Zamanla</span>
                {scheduleType === 'later' && <Check className="w-5 h-5 ml-2" />}
              </motion.button>
            </div>

            <AnimatePresence>
              {scheduleType === 'later' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4"
                >
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-4 py-3 text-white input-focus transition-all duration-300"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right Column - Groups & Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Group Selection */}
          <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Hedef Gruplar
              </label>
              <span className="text-xs text-slate-500">{selectedGroups.length} grup seçildi</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {mockGroups.map((group, index) => (
                <motion.button
                  key={group.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left ${
                    selectedGroups.includes(group.id)
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-indigo-500/20 hover:border-indigo-500/40 bg-[#16162a]'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedGroups.includes(group.id)
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-slate-600'
                  }`}>
                    {selectedGroups.includes(group.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{group.name}</p>
                    <p className="text-xs text-slate-500">{group.memberCount.toLocaleString()} üye</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl border border-indigo-500/30 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Özet</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Seçilen Gruplar</span>
                <span className="text-white font-medium">{selectedGroups.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Toplam Alıcı</span>
                <span className="text-white font-medium">{totalRecipients.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tahmini Süre</span>
                <span className="text-white font-medium">~{Math.ceil(totalRecipients / 30)} dk</span>
              </div>
              <div className="h-px bg-indigo-500/20 my-3" />
              <div className="flex justify-between">
                <span className="text-slate-400">Gönderim Türü</span>
                <span className="text-indigo-300 font-medium">
                  {scheduleType === 'now' ? 'Anlık' : 'Zamanlanmış'}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!title || !message || selectedGroups.length === 0}
            className="w-full py-4 rounded-xl btn-gradient text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
          >
            <Send className="w-5 h-5" />
            {scheduleType === 'now' ? 'Yayını Başlat' : 'Zamanla'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
