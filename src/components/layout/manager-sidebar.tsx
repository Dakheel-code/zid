'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Store, 
  FileText, 
  Megaphone, 
  Calendar,
  Settings,
  LogOut,
  User,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createBrowserClient } from '@supabase/ssr'

const navItems = [
  { href: '/manager', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/manager/stores', label: 'متاجري', icon: Store },
  { href: '/manager/tasks', label: 'مهامي', icon: FileText },
  { href: '/manager/announcements', label: 'التعاميم', icon: Megaphone },
  { href: '/manager/meetings', label: 'اجتماعاتي', icon: Calendar },
  { href: '/manager/settings', label: 'الإعدادات', icon: Settings },
]

export function ManagerSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
        // جلب اسم المستخدم من profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single()
        setUserName(profile?.name || user.email?.split('@')[0] || 'مدير')
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed right-0 top-0 z-50 h-screen w-64 border-l border-border bg-card hidden lg:block flex flex-col">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/manager" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-secondary-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">ZID</span>
          </div>
          <span className="font-bold text-lg">مدير العلاقة</span>
        </Link>
      </div>

      {/* اسم المدير */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#a855f7]/20 flex items-center justify-center">
            <User className="h-5 w-5 text-[#a855f7]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{userName || 'جاري التحميل...'}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/manager' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* الدليل التشغيلي */}
      <div className="p-4 border-t border-border">
        <a
          href="/guide.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-[#a855f7] hover:bg-[#a855f7]/10 transition-colors"
        >
          <BookOpen className="h-5 w-5" />
          الدليل التشغيلي
        </a>
      </div>

      {/* زر تسجيل الخروج */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  )
}
