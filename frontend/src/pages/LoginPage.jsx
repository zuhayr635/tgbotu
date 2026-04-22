import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/api'
import { toast } from 'react-hot-toast'
import { MessageCircle } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const form = new FormData()
      form.append('username', username)
      form.append('password', password)
      const res = await login(form)
      localStorage.setItem('token', res.data.access_token)
      // Kullanıcı bilgisini kaydet
      localStorage.setItem('user', JSON.stringify({
        id: res.data.user_id,
        username: res.data.username,
        email: res.data.email,
        is_admin: res.data.is_admin,
        plan_type: res.data.plan_type,
        tokens: res.data.tokens
      }))
      toast.success('Giris basarili')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Giris basarisiz')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold gradient-text">TG Panel</h1>
          <p className="text-slate-400 mt-2">Telegram Broadcast Yönetim Paneli</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Giris Yap</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Kullanıcı Adı</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 input-focus"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Sifre</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#16162a] border border-indigo-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 input-focus"
                required
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl btn-gradient text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Giris yapiliyor...
                </>
              ) : 'Giris Yap'}
            </motion.button>
          </form>

          {/* Register Link */}
          <p className="text-center text-slate-400 text-sm mt-6">
            Hesabınız yok mu?{' '}
            <a href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Kayıt Ol
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          © 2024 TG Panel. Tüm hakları saklıdır.
        </p>
      </motion.div>
    </div>
  )
}
