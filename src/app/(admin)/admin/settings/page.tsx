'use client'

import { 
  Settings, 
  Bell,
  ChevronLeft,
  Shield,
  Palette,
  Globe
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface SettingsLink {
  title: string
  description: string
  href: string
  icon: typeof Bell
  iconColor: string
}

const settingsLinks: SettingsLink[] = [
  {
    title: 'إعدادات الإشعارات',
    description: 'تحكم في أنواع الإشعارات وأولوياتها',
    href: '/admin/settings/notifications',
    icon: Bell,
    iconColor: 'text-blue-500 bg-blue-100'
  },
  {
    title: 'الأمان والصلاحيات',
    description: 'إدارة صلاحيات المستخدمين والأدوار',
    href: '/admin/settings/security',
    icon: Shield,
    iconColor: 'text-green-500 bg-green-100'
  },
  {
    title: 'المظهر',
    description: 'تخصيص ألوان وشكل الواجهة',
    href: '/admin/settings/appearance',
    icon: Palette,
    iconColor: 'text-purple-500 bg-purple-100'
  },
  {
    title: 'اللغة والمنطقة',
    description: 'إعدادات اللغة والتوقيت',
    href: '/admin/settings/locale',
    icon: Globe,
    iconColor: 'text-amber-500 bg-amber-100'
  }
]

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6" />
          الإعدادات
        </h1>
        <p className="text-muted-foreground">إعدادات النظام العامة</p>
      </div>

      {/* Settings Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${link.iconColor}`}>
                      <link.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{link.title}</h3>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                  </div>
                  <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
