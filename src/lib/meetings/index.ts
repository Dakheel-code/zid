import type { MeetingV2, MeetingSettings } from '@/lib/supabase/types-simple'

export type Meeting = MeetingV2
export type MeetingSlot = MeetingSettings

export interface TimeSlot {
  startTime: string
  endTime: string
  isAvailable: boolean
}

export interface DayAvailability {
  dayOfWeek: number
  dayName: string
  slots: TimeSlot[]
}

export const DAYS_OF_WEEK = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الاثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' },
]

export function getDayName(dayOfWeek: number): string {
  return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label ?? ''
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  const period = hour >= 12 ? 'م' : 'ص'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${minutes} ${period}`
}

export function generateTimeSlots(
  startHour: number = 9,
  endHour: number = 17,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = []
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(timeString)
    }
  }
  
  return slots
}

export function isSlotAvailable(
  slot: TimeSlot,
  existingMeetings: Meeting[],
  date: Date
): boolean {
  if (!slot.isAvailable) return false

  const slotStart = new Date(date)
  const [startHour, startMinute] = slot.startTime.split(':').map(Number)
  slotStart.setHours(startHour, startMinute, 0, 0)

  const slotEnd = new Date(date)
  const [endHour, endMinute] = slot.endTime.split(':').map(Number)
  slotEnd.setHours(endHour, endMinute, 0, 0)

  return !existingMeetings.some(meeting => {
    const meetingStart = new Date(meeting.start_time)
    const meetingEnd = new Date(meeting.end_time)
    return (
      (slotStart >= meetingStart && slotStart < meetingEnd) ||
      (slotEnd > meetingStart && slotEnd <= meetingEnd) ||
      (slotStart <= meetingStart && slotEnd >= meetingEnd)
    )
  })
}

export function getMeetingDuration(meeting: Meeting): number {
  const start = new Date(meeting.start_time)
  const end = new Date(meeting.end_time)
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60))
}
