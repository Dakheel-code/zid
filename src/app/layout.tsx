import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ZID Dashboard - نظام إدارة المتاجر',
  description: 'نظام إدارة متاجر لمدراء العلاقة',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
