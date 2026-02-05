'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // التحقق من تسجيل الدخول عند تحميل الصفحة
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // المستخدم مسجل دخول، جلب الدور وتوجيهه
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = profile?.role || 'manager'
        if (role === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/manager')
        }
      } else {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message === 'Invalid login credentials' 
          ? 'بيانات الدخول غير صحيحة' 
          : authError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // جلب الـ role من profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        const role = profile?.role || 'manager'
        
        // التوجيه حسب الدور
        if (role === 'admin') {
          window.location.href = '/admin/dashboard'
        } else {
          window.location.href = '/manager'
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  // عرض شاشة تحميل أثناء التحقق
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1625]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1625] p-4">
      <div className="bg-[#2d2640] border border-[#3d3555] rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">مديري العلاقات</h1>
          <p className="text-gray-400 text-sm">أدخل بيانات حسابك للوصول إلى لوحة التحكم</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              className="w-full h-11 px-4 rounded-lg bg-[#1a1625] border border-[#3d3555] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-300">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
              className="w-full h-11 px-4 rounded-lg bg-[#1a1625] border border-[#3d3555] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        {/* الشعار في الأسفل */}
        <div className="mt-6 pt-4 border-t border-[#3d3555] flex items-center justify-center gap-2">
          <span className="text-gray-500 text-xs">بواسطة:</span>
          <img 
            src="/zid-logo.png" 
            alt="ZID Logo" 
            className="h-6 w-auto"
          />
        </div>
      </div>
    </div>
  )
}
