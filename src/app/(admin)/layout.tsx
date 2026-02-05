'use client'

import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { Header } from '@/components/layout/header'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <AdminSidebar />
      <div className="lg:pr-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
