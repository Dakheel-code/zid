'use client'

import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { BottomNav } from '@/components/layout/bottom-nav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <AdminSidebar />
      <MobileNav type="admin" />
      <div className="lg:pr-60">
        <Header />
        <main className="p-4 lg:p-6 pt-20 lg:pt-6 pb-20 lg:pb-6">{children}</main>
      </div>
      <BottomNav type="admin" />
    </div>
  )
}
