'use client'

import { useState, useEffect } from 'react'
import { Palette, ArrowRight, Sun, Moon, Monitor, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useTheme } from '@/components/providers/theme-provider'

export default function AppearanceSettingsPage() {
  const { theme: currentTheme, setTheme: setGlobalTheme } = useTheme()
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark')
  const [primaryColor, setPrimaryColor] = useState('#a855f7')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // تحميل الإعدادات المحفوظة
    const savedColor = localStorage.getItem('primaryColor')
    if (savedColor) setPrimaryColor(savedColor)
    
    if (currentTheme === 'light' || currentTheme === 'dark') {
      setTheme(currentTheme)
    }
  }, [currentTheme])

  const themes = [
    { key: 'system', label: 'تلقائي', icon: Monitor },
    { key: 'dark', label: 'داكن', icon: Moon },
    { key: 'light', label: 'فاتح', icon: Sun }
  ]

  const colors = [
    { value: '#a855f7', label: 'بنفسجي' },
    { value: '#3b82f6', label: 'أزرق' },
    { value: '#22c55e', label: 'أخضر' },
    { value: '#f59e0b', label: 'برتقالي' },
    { value: '#ef4444', label: 'أحمر' },
    { value: '#ec4899', label: 'وردي' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/settings" className="p-2 hover:bg-[#3d2d5a] rounded-lg">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Palette className="h-6 w-6 text-purple-500" />
            المظهر
          </h1>
          <p className="text-[#8b7fad]">تخصيص ألوان وشكل الواجهة</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* اختيار الثيم */}
        <Card className="bg-[#2d1f4e] border-[#5a4985]/40">
          <CardContent className="p-6">
            <h3 className="font-semibold text-white mb-4">وضع العرض</h3>
            <div className="grid grid-cols-3 gap-4">
              {themes.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key as typeof theme)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme === t.key
                      ? 'border-[#a855f7] bg-[#a855f7]/20'
                      : 'border-[#5a4985]/40 hover:border-[#5a4985]'
                  }`}
                >
                  <t.icon className={`h-6 w-6 mx-auto mb-2 ${theme === t.key ? 'text-[#a855f7]' : 'text-[#8b7fad]'}`} />
                  <p className={`text-sm ${theme === t.key ? 'text-white' : 'text-[#8b7fad]'}`}>{t.label}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* اللون الرئيسي */}
        <Card className="bg-[#2d1f4e] border-[#5a4985]/40">
          <CardContent className="p-6">
            <h3 className="font-semibold text-white mb-4">اللون الرئيسي</h3>
            <div className="flex flex-row-reverse flex-wrap gap-3">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setPrimaryColor(color.value)}
                  className={`w-12 h-12 rounded-full border-4 transition-all ${
                    primaryColor === color.value
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
            <p className="text-sm text-[#8b7fad] mt-3">اللون المحدد: {colors.find(c => c.value === primaryColor)?.label}</p>
          </CardContent>
        </Card>

        {/* حجم الخط */}
        <Card className="bg-[#2d1f4e] border-[#5a4985]/40">
          <CardContent className="p-6">
            <h3 className="font-semibold text-white mb-4">حجم الخط</h3>
            <div className="flex items-center gap-4 flex-row-reverse">
              <span className="text-sm text-[#8b7fad]">صغير</span>
              <input
                type="range"
                min="12"
                max="18"
                defaultValue="14"
                className="flex-1 h-2 bg-[#5a4985] rounded-lg appearance-none cursor-pointer"
                style={{ direction: 'ltr' }}
              />
              <span className="text-sm text-[#8b7fad]">كبير</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* زر الحفظ */}
      <div className="flex justify-end">
        <Button 
          className="bg-[#22c55e] hover:bg-[#16a34a]"
          onClick={() => {
            // حفظ الثيم
            if (theme !== 'system') {
              setGlobalTheme(theme as 'light' | 'dark')
            }
            // حفظ اللون
            localStorage.setItem('primaryColor', primaryColor)
            document.documentElement.style.setProperty('--primary-color', primaryColor)
            
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
          }}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4 ml-2" />
              تم الحفظ!
            </>
          ) : (
            'حفظ التغييرات'
          )}
        </Button>
      </div>
    </div>
  )
}
