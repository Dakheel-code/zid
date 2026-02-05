'use client'

import { useState } from 'react'
import { Globe, ArrowRight, Clock, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LocaleSettingsPage() {
  const [language, setLanguage] = useState('ar')
  const [timezone, setTimezone] = useState('Asia/Riyadh')
  const [dateFormat, setDateFormat] = useState('dd/mm/yyyy')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/settings" className="p-2 hover:bg-[#3d2d5a] rounded-lg">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="h-6 w-6 text-amber-500" />
            اللغة والمنطقة
          </h1>
          <p className="text-[#8b7fad]">إعدادات اللغة والتوقيت</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* اللغة */}
        <Card className="bg-[#2d1f4e] border-[#5a4985]/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-500/20">
                  <Globe className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">اللغة</h3>
                  <p className="text-sm text-[#8b7fad]">لغة واجهة المستخدم</p>
                </div>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#1a1230] border border-[#5a4985]/60 rounded-lg px-4 py-2 text-white"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* المنطقة الزمنية */}
        <Card className="bg-[#2d1f4e] border-[#5a4985]/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">المنطقة الزمنية</h3>
                  <p className="text-sm text-[#8b7fad]">توقيت عرض التواريخ والأوقات</p>
                </div>
              </div>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="bg-[#1a1230] border border-[#5a4985]/60 rounded-lg px-4 py-2 text-white"
              >
                <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                <option value="Asia/Dubai">دبي (GMT+4)</option>
                <option value="Asia/Kuwait">الكويت (GMT+3)</option>
                <option value="Africa/Cairo">القاهرة (GMT+2)</option>
                <option value="Europe/London">لندن (GMT+0)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* تنسيق التاريخ */}
        <Card className="bg-[#2d1f4e] border-[#5a4985]/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <Calendar className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">تنسيق التاريخ</h3>
                  <p className="text-sm text-[#8b7fad]">طريقة عرض التواريخ</p>
                </div>
              </div>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="bg-[#1a1230] border border-[#5a4985]/60 rounded-lg px-4 py-2 text-white"
              >
                <option value="dd/mm/yyyy">يوم/شهر/سنة</option>
                <option value="mm/dd/yyyy">شهر/يوم/سنة</option>
                <option value="yyyy-mm-dd">سنة-شهر-يوم</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* زر الحفظ */}
      <div className="flex justify-end">
        <Button 
          className="bg-[#22c55e] hover:bg-[#16a34a]"
          onClick={() => alert('تم حفظ الإعدادات')}
        >
          حفظ التغييرات
        </Button>
      </div>
    </div>
  )
}
