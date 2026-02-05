'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Add New Store Page - Dark Purple Theme
 */

export default function NewStorePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    store_name: '',
    store_url: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    priority: 'medium',
    status: 'new'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // في الواقع سيتم إرسال البيانات للـ API
    console.log('Form submitted:', formData)
    router.push('/admin/stores')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-[#3d2d5a] rounded-lg transition-colors"
        >
          <ArrowRight className="h-5 w-5 text-[#c4b5fd]" />
        </button>
        <div>
          <h1 className="text-[28px] font-extrabold text-white">إضافة متجر جديد</h1>
          <p className="text-[14px] text-[#c4b5fd] mt-1">أدخل بيانات المتجر الجديد</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-[#3d2d5a] border border-[#5a4985]/40 rounded-xl p-6 space-y-5">
          {/* Store Name */}
          <div>
            <label className="block text-[14px] font-medium text-white mb-2">اسم المتجر</label>
            <input
              type="text"
              name="store_name"
              value={formData.store_name}
              onChange={handleChange}
              required
              className="w-full h-11 px-4 text-[14px] bg-[#2d1f4e] border border-[#5a4985]/60 rounded-lg text-white placeholder:text-[#8b7fad] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
              placeholder="أدخل اسم المتجر"
            />
          </div>

          {/* Store URL */}
          <div>
            <label className="block text-[14px] font-medium text-white mb-2">رابط المتجر</label>
            <input
              type="url"
              name="store_url"
              value={formData.store_url}
              onChange={handleChange}
              required
              className="w-full h-11 px-4 text-[14px] bg-[#2d1f4e] border border-[#5a4985]/60 rounded-lg text-white placeholder:text-[#8b7fad] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
              placeholder="https://example.zid.store"
            />
          </div>

          {/* Owner Name */}
          <div>
            <label className="block text-[14px] font-medium text-white mb-2">اسم المالك</label>
            <input
              type="text"
              name="owner_name"
              value={formData.owner_name}
              onChange={handleChange}
              required
              className="w-full h-11 px-4 text-[14px] bg-[#2d1f4e] border border-[#5a4985]/60 rounded-lg text-white placeholder:text-[#8b7fad] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
              placeholder="أدخل اسم المالك"
            />
          </div>

          {/* Owner Email */}
          <div>
            <label className="block text-[14px] font-medium text-white mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              name="owner_email"
              value={formData.owner_email}
              onChange={handleChange}
              required
              className="w-full h-11 px-4 text-[14px] bg-[#2d1f4e] border border-[#5a4985]/60 rounded-lg text-white placeholder:text-[#8b7fad] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
              placeholder="email@example.com"
            />
          </div>

          {/* Owner Phone */}
          <div>
            <label className="block text-[14px] font-medium text-white mb-2">رقم الهاتف</label>
            <input
              type="tel"
              name="owner_phone"
              value={formData.owner_phone}
              onChange={handleChange}
              className="w-full h-11 px-4 text-[14px] bg-[#2d1f4e] border border-[#5a4985]/60 rounded-lg text-white placeholder:text-[#8b7fad] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
              placeholder="+966501234567"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[14px] font-medium text-white mb-2">الأولوية</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full h-11 px-4 text-[14px] bg-[#2d1f4e] border border-[#5a4985]/60 rounded-lg text-[#c4b5fd] focus:outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 transition-all"
            >
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" variant="primary" size="lg">
              <Store className="h-4 w-4 ml-2" />
              إضافة المتجر
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>
              إلغاء
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
