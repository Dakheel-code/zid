'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  Megaphone, 
  Settings,
  CheckSquare,
  BookOpen,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createBrowserClient } from '@supabase/ssr'

/**
 * Admin Sidebar - Dark Purple Theme
 * ==================================
 * ✅ Background داكن جداً
 * ✅ أيقونات بنفسجي فاتح
 * ✅ العنصر النشط: Background بنفسجي + أيقونة أبيض
 * ✅ Hover: Highlight بنفسجي خفيف
 * 📌 إحساس "نظام قوي"
 */

const navItems = [
  { href: '/admin/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/admin/stores', label: 'المتاجر', icon: Store },
  { href: '/admin/tasks', label: 'المهام', icon: CheckSquare },
  { href: '/admin/account-managers', label: 'مدراء العلاقات', icon: Users },
  { href: '/admin/announcements', label: 'التعاميم', icon: Megaphone },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [userName, setUserName] = useState<string>('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  useEffect(() => {
    const fetchUser = async () => {
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserName(profile.name || profile.email?.split('@')[0] || 'مستخدم')
        }
      }
    }
    fetchUser()
  }, [])

  return (
    <aside className="fixed right-0 top-0 z-50 h-screen w-60 border-l border-[#3d2d5a] bg-[#1a1230] hidden lg:block">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-[#3d2d5a] px-5">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <img 
            src="/zid-logo.png" 
            alt="ZID Logo" 
            className="h-9 w-auto"
          />
          <span className="font-bold text-white text-[16px]">{userName || 'جاري التحميل...'}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 mt-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-[14px] transition-all duration-200 rounded-xl relative',
                isActive
                  ? 'bg-[#a855f7] text-white font-semibold shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                  : 'text-[#c4b5fd] hover:bg-[#2d1f4e] hover:text-white'
              )}
            >
              <Icon className={cn(
                'h-5 w-5',
                isActive ? 'text-white' : 'text-[#a78bfa]'
              )} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* الدليل التشغيلي */}
      <div className="absolute bottom-20 left-0 right-0 px-3">
        <a
          href="/guide.html?admin=true"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 text-[14px] text-[#a78bfa] hover:bg-[#2d1f4e] hover:text-white rounded-xl transition-all"
        >
          <BookOpen className="h-5 w-5" />
          الدليل التشغيلي
        </a>
      </div>

      {/* زر تسجيل الخروج */}
      <div className="absolute bottom-4 left-0 right-0 px-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-[14px] text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <LogOut className="h-5 w-5" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  )
}
