'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Store, 
  CheckSquare, 
  Bell,
  User,
  Users,
  Megaphone
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  type: 'admin' | 'manager'
}

const adminNavItems = [
  { href: '/admin/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/admin/stores', label: 'المتاجر', icon: Store },
  { href: '/admin/tasks', label: 'المهام', icon: CheckSquare },
  { href: '/admin/account-managers', label: 'المدراء', icon: Users },
  { href: '/admin/announcements', label: 'التعاميم', icon: Megaphone },
]

const managerNavItems = [
  { href: '/manager/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/manager/stores', label: 'متاجري', icon: Store },
  { href: '/manager/tasks', label: 'المهام', icon: CheckSquare },
  { href: '/manager/notifications', label: 'الإشعارات', icon: Bell },
  { href: '/manager/settings', label: 'حسابي', icon: User },
]

export function BottomNav({ type }: BottomNavProps) {
  const pathname = usePathname()
  const navItems = type === 'admin' ? adminNavItems : managerNavItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1230] border-t border-[#3d2d5a] lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== `/${type}/dashboard` && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px]',
                isActive
                  ? 'text-white'
                  : 'text-[#8b7fad]'
              )}
            >
              <div className={cn(
                'p-1.5 rounded-xl transition-all',
                isActive && 'bg-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.4)]'
              )}>
                <Icon className={cn(
                  'h-5 w-5',
                  isActive ? 'text-white' : 'text-[#a78bfa]'
                )} />
              </div>
              <span className={cn(
                'text-[10px] font-medium',
                isActive ? 'text-white' : 'text-[#8b7fad]'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
