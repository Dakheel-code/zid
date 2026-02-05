'use client'

import { Store, ClipboardList, Calendar, Megaphone } from 'lucide-react'
import { PageHeader, StatCard } from '@/components/ui'

export default function ManagerDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="لوحة التحكم" 
        description="مرحباً بك في لوحة تحكم مدير العلاقة"
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="متاجري"
          value="0"
          description="متجر تحت إدارتي"
          icon={Store}
        />
        
        <StatCard
          title="مهامي"
          value="0"
          description="مهمة معلقة"
          icon={ClipboardList}
        />
        
        <StatCard
          title="اجتماعات اليوم"
          value="0"
          description="اجتماع مجدول"
          icon={Calendar}
        />
        
        <StatCard
          title="التعاميم"
          value="0"
          description="تعميم جديد"
          icon={Megaphone}
        />
      </div>
    </div>
  )
}
