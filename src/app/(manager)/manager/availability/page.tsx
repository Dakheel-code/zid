'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Clock } from 'lucide-react'

interface DayAvailability {
  day: string
  dayEn: string
  enabled: boolean
  startTime: string
  endTime: string
}

const initialAvailability: DayAvailability[] = [
  { day: 'الأحد', dayEn: 'sunday', enabled: true, startTime: '09:00', endTime: '17:00' },
  { day: 'الإثنين', dayEn: 'monday', enabled: true, startTime: '09:00', endTime: '17:00' },
  { day: 'الثلاثاء', dayEn: 'tuesday', enabled: true, startTime: '09:00', endTime: '17:00' },
  { day: 'الأربعاء', dayEn: 'wednesday', enabled: true, startTime: '09:00', endTime: '17:00' },
  { day: 'الخميس', dayEn: 'thursday', enabled: true, startTime: '09:00', endTime: '17:00' },
  { day: 'الجمعة', dayEn: 'friday', enabled: false, startTime: '09:00', endTime: '17:00' },
  { day: 'السبت', dayEn: 'saturday', enabled: false, startTime: '09:00', endTime: '17:00' },
]

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<DayAvailability[]>(initialAvailability)

  const toggleDay = (dayEn: string) => {
    setAvailability(prev => 
      prev.map(d => d.dayEn === dayEn ? { ...d, enabled: !d.enabled } : d)
    )
  }

  const updateTime = (dayEn: string, field: 'startTime' | 'endTime', value: string) => {
    setAvailability(prev => 
      prev.map(d => d.dayEn === dayEn ? { ...d, [field]: value } : d)
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">أوقات التواجد</h1>
        <Button>حفظ التغييرات</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            جدول أوقات التواجد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availability.map((day) => (
              <div 
                key={day.dayEn} 
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Switch 
                    checked={day.enabled} 
                    onCheckedChange={() => toggleDay(day.dayEn)}
                  />
                  <span className="font-medium w-20">{day.day}</span>
                </div>
                
                {day.enabled ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) => updateTime(day.dayEn, 'startTime', e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm"
                    />
                    <span className="text-muted-foreground">إلى</span>
                    <input
                      type="time"
                      value={day.endTime}
                      onChange={(e) => updateTime(day.dayEn, 'endTime', e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-muted-foreground">غير متاح</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
