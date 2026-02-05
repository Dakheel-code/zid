'use client'

import { useState } from 'react'
import { Shield, ArrowRight, Users, Key, Lock, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const ROLES = [
  { id: 'admin', name: 'مدير النظام', permissions: ['all'] },
  { id: 'manager', name: 'مدير علاقات', permissions: ['stores', 'tasks', 'meetings'] },
  { id: 'viewer', name: 'مشاهد', permissions: ['view_only'] }
]

export default function SecuritySettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState('30')
  const [showRolesModal, setShowRolesModal] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/settings" className="p-2 hover:bg-[#3d2d5a] rounded-lg">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-500" />
            الأمان والصلاحيات
          </h1>
          <p className="text-[#8b7fad]">إدارة صلاحيات المستخدمين والأدوار</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* المصادقة الثنائية */}
        <Card className="bg-[#2d1f4e] border-[#5a4985]/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/20">
                  <Key className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">المصادقة الثنائية</h3>
                  <p className="text-sm text-[#8b7fad]">تفعيل طبقة حماية إضافية لتسجيل الدخول</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#5a4985] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* مهلة الجلسة */}
        <Card className="bg-[#2d1f4e] border-[#5a4985]/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <Lock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">مهلة الجلسة</h3>
                  <p className="text-sm text-[#8b7fad]">تسجيل الخروج التلقائي بعد فترة عدم النشاط</p>
                </div>
              </div>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="bg-[#1a1230] border border-[#5a4985]/60 rounded-lg px-4 py-2 text-white"
              >
                <option value="15">15 دقيقة</option>
                <option value="30">30 دقيقة</option>
                <option value="60">ساعة</option>
                <option value="120">ساعتين</option>
                <option value="never">أبداً</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* إدارة الأدوار */}
        <Card className="bg-[#2d1f4e] border-[#5a4985]/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">إدارة الأدوار</h3>
                  <p className="text-sm text-[#8b7fad]">تحديد صلاحيات كل دور في النظام</p>
                </div>
              </div>
              <Button 
                className="bg-[#a855f7] hover:bg-[#9333ea]"
                onClick={() => setShowRolesModal(true)}
              >
                إدارة الأدوار
              </Button>
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

      {/* نافذة إدارة الأدوار */}
      {showRolesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2d1f4e] border border-[#5a4985]/40 rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">إدارة الأدوار والصلاحيات</h2>
              <button
                onClick={() => setShowRolesModal(false)}
                className="p-2 hover:bg-[#3d2d5a] rounded-lg"
              >
                <X className="h-5 w-5 text-[#8b7fad]" />
              </button>
            </div>

            <div className="space-y-4">
              {ROLES.map((role) => (
                <div key={role.id} className="p-4 bg-[#1a1230] rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">{role.name}</h3>
                    <span className="text-xs text-[#8b7fad] bg-[#5a4985]/30 px-2 py-1 rounded">
                      {role.id}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['المتاجر', 'المهام', 'الاجتماعات', 'التعاميم', 'التقارير', 'الإعدادات'].map((perm) => (
                      <label key={perm} className="flex items-center gap-2 text-sm text-[#c4b5fd]">
                        <input
                          type="checkbox"
                          defaultChecked={role.permissions.includes('all')}
                          className="w-4 h-4 rounded border-[#5a4985] bg-[#1a1230] text-[#a855f7]"
                        />
                        {perm}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                className="flex-1 bg-[#22c55e] hover:bg-[#16a34a]"
                onClick={() => {
                  alert('تم حفظ الصلاحيات')
                  setShowRolesModal(false)
                }}
              >
                حفظ الصلاحيات
              </Button>
              <Button 
                variant="secondary"
                onClick={() => setShowRolesModal(false)}
                className="border-[#5a4985] text-[#c4b5fd] hover:bg-[#3d2d5a]"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
