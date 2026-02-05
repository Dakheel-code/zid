'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('Starting login with:', email)
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      console.log('Calling signInWithPassword...')
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Auth result:', { data, authError })

      if (authError) {
        console.error('Auth error:', authError)
        setError(authError.message === 'Invalid login credentials' 
          ? 'بيانات الدخول غير صحيحة' 
          : authError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        console.log('User logged in:', data.user.id)
        
        // جلب الـ role من profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        console.log('Profile result:', { profile, profileError })

        const role = profile?.role || 'admin'
        const redirectUrl = role === 'admin' ? '/admin/dashboard' : '/manager/dashboard'
        console.log('Redirecting to:', redirectUrl)
        
        // استخدام window.location للتأكد من الانتقال
        window.location.href = redirectUrl
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0a1a] via-[#1a1230] to-[#0f0a1a] p-4">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-800/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative bg-gradient-to-b from-[#2d2640]/90 to-[#1a1230]/90 backdrop-blur-xl border border-[#5a4985]/30 rounded-3xl shadow-2xl shadow-purple-900/20 w-full max-w-md p-10">
        {/* الشعار والعنوان */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full" />
            <img src="/zid-logo.png" alt="زد" className="h-16 w-auto mx-auto relative" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-3">
            مدراء العلاقات
          </h1>
          <p className="text-[#8b7fad] text-sm">أدخل بيانات حسابك للوصول إلى لوحة التحكم</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center backdrop-blur-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-[#c4b5fd] block text-right">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                className="w-full h-12 px-4 rounded-xl bg-[#1a1230]/80 border border-[#5a4985]/40 text-white placeholder-[#6b5b8a] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-[#c4b5fd] block text-right">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                className="w-full h-12 px-4 rounded-xl bg-[#1a1230]/80 border border-[#5a4985]/40 text-white placeholder-[#6b5b8a] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30 hover:shadow-purple-500/40 mt-8"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جاري تسجيل الدخول...
              </span>
            ) : 'تسجيل الدخول'}
          </button>
        </form>
        
        {/* تذييل */}
        <div className="mt-8 pt-6 border-t border-[#5a4985]/20 text-center">
          <p className="text-[#6b5b8a] text-xs">© 2026 زد - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  )
}
