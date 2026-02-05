'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Store, 
  Users, 
  Megaphone, 
  Settings,
  CheckSquare,
  BookOpen,
  LogOut,
  Calendar,
  Bell,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createBrowserClient } from '@supabase/ssr'

interface MobileNavProps {
  type: 'admin' | 'manager'
}

const adminNavItems = [
  { href: '/admin/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/admin/stores', label: 'المتاجر', icon: Store },
  { href: '/admin/tasks', label: 'المهام', icon: CheckSquare },
  { href: '/admin/account-managers', label: 'مدراء العلاقات', icon: Users },
  { href: '/admin/announcements', label: 'التعاميم', icon: Megaphone },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
]

const managerNavItems = [
  { href: '/manager/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/manager/stores', label: 'متاجري', icon: Store },
  { href: '/manager/tasks', label: 'المهام', icon: CheckSquare },
  { href: '/manager/meetings', label: 'الاجتماعات', icon: Calendar },
  { href: '/manager/announcements', label: 'التعاميم', icon: Megaphone },
  { href: '/manager/notifications', label: 'الإشعارات', icon: Bell },
  { href: '/manager/availability', label: 'أوقات التواجد', icon: Clock },
  { href: '/manager/settings', label: 'الإعدادات', icon: Settings },
]

export function MobileNav({ type }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const pathname = usePathname()

  const navItems = type === 'admin' ? adminNavItems : managerNavItems
  const guideUrl = type === 'admin' ? '/guide.html?admin=true' : '/guide.html'

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
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

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#1a1230] border-b border-[#3d2d5a] lg:hidden">
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 text-[#c4b5fd] hover:text-white rounded-lg hover:bg-[#2d1f4e] transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <img src="/zid-logo.png" alt="ZID" className="h-8 w-auto" />
            <span className="font-bold text-white text-sm">{userName || 'ZID'}</span>
          </div>
          
          <div className="w-10" /> {/* Spacer for balance */}
        </div>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        'fixed top-0 right-0 z-50 h-full w-72 bg-[#1a1230] transform transition-transform duration-300 ease-in-out lg:hidden',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-[#3d2d5a]">
          <div className="flex items-center gap-2">
            <img src="/zid-logo.png" alt="ZID" className="h-8 w-auto" />
            <span className="font-bold text-white">{userName || 'ZID'}</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-[#c4b5fd] hover:text-white rounded-lg hover:bg-[#2d1f4e] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 mt-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
              (item.href !== `/${type}/dashboard` && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-[14px] transition-all duration-200 rounded-xl',
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

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-[#3d2d5a] bg-[#1a1230]">
          <a
            href={guideUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 text-[14px] text-[#a78bfa] hover:bg-[#2d1f4e] hover:text-white rounded-xl transition-all mb-1"
          >
            <BookOpen className="h-5 w-5" />
            الدليل التشغيلي
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-[14px] text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut className="h-5 w-5" />
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  )
}
