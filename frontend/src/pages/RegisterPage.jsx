import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../lib/api'
import { toast } from 'react-hot-toast'
import { MessageCircle, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors = {}
    
    if (username.length < 3) {
      newErrors.username = 'Kullanıcı adı en az 3 karakter olmalıdır'
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Kullanıcı adı sadece harf, rakam ve underscore içerebilir'
    }
    
    if (!email.includes('@')) {
      newErrors.email = 'Geçerli bir e-posta adresi girin'
    }
    
    if (password.length < 8) {
      newErrors.password = 'Şifre en az 8 karakter olmalıdır'
    }
    
    if (password !== passwordConfirm) {
      newErrors.passwordConfirm = 'Şifreler eşleşmiyor'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    try {
      await register({
        username,
        email,
        password,
        password_confirm: passwordConfirm
      })
      toast.success('Kayıt başarılı! Admin onayı bekleniyor.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Kayıt başarısız')
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

        {/* Register Form */}
        <div className="bg-[#1e1e3a] rounded-2xl border border-indigo-500/20 p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Kayıt Ol</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Kullanıcı Adı</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="kullanici_adi"
                className={`w-full bg-[#16162a] border rounded-xl px-4 py-3 text-white placeholder-slate-500 input-focus ${
                  errors.username ? 'border-red-500/50' : 'border-indigo-500/20'
                }`}
                required
              />
              {errors.username && (
                <p className="text-red-400 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@example.com"
                className={`w-full bg-[#16162a] border rounded-xl px-4 py-3 text-white placeholder-slate-500 input-focus ${
                  errors.email ? 'border-red-500/50' : 'border-indigo-500/20'
                }`}
                required
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Şifre</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-[#16162a] border rounded-xl px-4 py-3 text-white placeholder-slate-500 input-focus pr-10 ${
                    errors.password ? 'border-red-500/50' : 'border-indigo-500/20'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Password Confirm */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Şifre (Tekrar)</label>
              <div className="relative">
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-[#16162a] border rounded-xl px-4 py-3 text-white placeholder-slate-500 input-focus pr-10 ${
                    errors.passwordConfirm ? 'border-red-500/50' : 'border-indigo-500/20'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-300"
                >
                  {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.passwordConfirm && (
                <p className="text-red-400 text-xs mt-1">{errors.passwordConfirm}</p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl btn-gradient text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 mt-6"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Kayıt yapılıyor...
                </>
              ) : 'Kayıt Ol'}
            </motion.button>
          </form>

          {/* Login Link */}
          <p className="text-center text-slate-400 text-sm mt-6">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Giriş Yap
            </Link>
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
