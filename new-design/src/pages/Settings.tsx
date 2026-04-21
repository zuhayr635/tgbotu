import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Bot,
  Bell,
  Shield,
  Zap,
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  Key,
  Globe,
  Mail,
  Clock,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { mockSettings } from '../data/mockData';

export default function Settings() {
  const [settings, setSettings] = useState(mockSettings);
  const [activeTab, setActiveTab] = useState<'bot' | 'notifications' | 'security' | 'advanced'>('bot');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'bot', label: 'Bot Ayarları', icon: Bot },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'security', label: 'Güvenlik', icon: Shield },
    { id: 'advanced', label: 'Gelişmiş', icon: Zap },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-indigo-600 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            Ayarlar
          </h1>
          <p className="text-slate-400 mt-1">Sistem yapılandırmasını yönetin</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 rounded-xl btn-gradient text-white font-medium shadow-lg shadow-indigo-500/30"
        >
          {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saved ? 'Kaydedildi' : 'Kaydet'}
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ x: 4 }}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white'
                      : 'text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          {activeTab === 'bot' && (
            <div className="space-y-6">
              {/* Bot Token */}
              <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-400" />
                  Bot Token
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Bot Token</label>
                    <input
                      type="password"
                      value={settings.botToken}
                      onChange={(e) => setSettings({ ...settings, botToken: e.target.value })}
                      className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-4 py-3 text-white input-focus transition-all duration-300"
                    />
                    <p className="text-xs text-slate-500 mt-2">BotFather'dan aldığınız token'ı buraya girin.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Bot Adı</label>
                    <input
                      type="text"
                      value={settings.botName}
                      onChange={(e) => setSettings({ ...settings, botName: e.target.value })}
                      className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-4 py-3 text-white input-focus transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              {/* Rate Limiting */}
              <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  Hız Limiti
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Dakika başına maksimum mesaj: {settings.rateLimit}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={settings.rateLimit}
                    onChange={(e) => setSettings({ ...settings, rateLimit: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>10</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-400" />
                  E-posta Bildirimleri
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bildirim E-postası</label>
                  <input
                    type="email"
                    value={settings.notificationEmail}
                    onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                    className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-4 py-3 text-white input-focus transition-all duration-300"
                  />
                </div>
              </div>

              <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Bildirim Tercihleri</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Yayın tamamlandığında bildir', checked: true },
                    { label: 'Hata oluştuğunda bildir', checked: true },
                    { label: 'Günlük özet gönder', checked: false },
                    { label: 'Yeni grup eklendiğinde bildir', checked: false },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-indigo-500/10 last:border-0">
                      <span className="text-slate-300">{item.label}</span>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {}}
                        className={`w-12 h-6 rounded-full relative transition-colors ${
                          item.checked ? 'bg-indigo-500' : 'bg-slate-700'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          item.checked ? 'left-7' : 'left-1'
                        }`} />
                      </motion.button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  Güvenlik Ayarları
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-slate-300 font-medium">İki Faktörlü Doğrulama</p>
                      <p className="text-sm text-slate-500">Hesabınıza ekstra güvenlik katmanı ekleyin</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/30 transition-colors"
                    >
                      Etkinleştir
                    </motion.button>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-indigo-500/10">
                    <div>
                      <p className="text-slate-300 font-medium">Oturum Yönetimi</p>
                      <p className="text-sm text-slate-500">Tüm cihazlardan çıkış yap</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-lg bg-rose-500/20 text-rose-400 text-sm font-medium hover:bg-rose-500/30 transition-colors"
                    >
                      Çıkış Yap
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">API Erişimi</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">API Anahtarı</span>
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-1 bg-slate-800 rounded-lg text-sm text-slate-400">
                        sk-••••••••••••••••
                      </code>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  Webhook Ayarları
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Webhook URL</label>
                  <input
                    type="url"
                    value={settings.webhookUrl}
                    onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                    className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-4 py-3 text-white input-focus transition-all duration-300"
                  />
                  <p className="text-xs text-slate-500 mt-2">Telegram güncellemeleri için webhook URL'si.</p>
                </div>
              </div>

              <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Otomatik Yeniden Deneme</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-slate-300 font-medium">Otomatik Yeniden Deneme</p>
                      <p className="text-sm text-slate-500">Başarısız mesajları otomatik tekrar gönder</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSettings({ ...settings, autoRetry: !settings.autoRetry })}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        settings.autoRetry ? 'bg-indigo-500' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                        settings.autoRetry ? 'left-7' : 'left-1'
                      }`} />
                    </motion.button>
                  </div>
                  {settings.autoRetry && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Maksimum Deneme: {settings.retryAttempts}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={settings.retryAttempts}
                        onChange={(e) => setSettings({ ...settings, retryAttempts: parseInt(e.target.value) })}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-rose-500/10 rounded-2xl border border-rose-500/20 p-6">
                <h3 className="text-lg font-semibold text-rose-400 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Tehlikeli Bölge
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 font-medium">Tüm Verileri Sıfırla</p>
                      <p className="text-sm text-slate-500">Bu işlem geri alınamaz!</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 rounded-lg bg-rose-500/20 text-rose-400 text-sm font-medium hover:bg-rose-500/30 transition-colors"
                    >
                      Sıfırla
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
