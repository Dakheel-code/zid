'use client'

import { ManagerSidebar } from '@/components/layout/manager-sidebar'
import { Header } from '@/components/layout/header'

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <ManagerSidebar />
      <div className="lg:pr-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
