'use client'

import { ManagerSidebar } from '@/components/layout/manager-sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <ManagerSidebar />
      <MobileNav type="manager" />
      <div className="lg:pr-64">
        <Header />
        <main className="p-4 lg:p-6 pt-20 lg:pt-6">{children}</main>
      </div>
    </div>
  )
}
