'use client'

import { Store, Users, ClipboardList, Calendar, Plus } from 'lucide-react'
import { PageHeader, StatCard, PrimaryButton } from '@/components/ui'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="لوحة الإدارة" 
        description="مرحباً بك في لوحة تحكم الأدمن"
      >
        <PrimaryButton leftIcon={Plus}>
          إضافة متجر
        </PrimaryButton>
      </PageHeader>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي المتاجر"
          value="0"
          description="متجر مسجل"
          icon={Store}
        />
        
        <StatCard
          title="مدراء العلاقة"
          value="0"
          description="مدير نشط"
          icon={Users}
        />
        
        <StatCard
          title="المهام المعلقة"
          value="0"
          description="مهمة قيد الانتظار"
          icon={ClipboardList}
        />
        
        <StatCard
          title="الاجتماعات اليوم"
          value="0"
          description="اجتماع مجدول"
          icon={Calendar}
        />
      </div>
    </div>
  )
}
