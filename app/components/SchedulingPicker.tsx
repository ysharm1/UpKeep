'use client'

import { useState, useEffect } from 'react'

interface TimeSlot {
  time: string
  available: boolean
}

interface SchedulingPickerProps {
  onSelectDateTime: (dateTime: Date) => void
  selectedDateTime: Date | null
}

export default function SchedulingPicker({ onSelectDateTime, selectedDateTime }: SchedulingPickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])

  useEffect(() => {
    // Generate next 7 days (excluding today)
    const dates: string[] = []
    const today = new Date()
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    
    setAvailableDates(dates)
  }, [])

  useEffect(() => {
    if (selectedDate) {
      // Generate time slots for selected date
      const slots: TimeSlot[] = []
      const startHour = 8 // 8 AM
      const endHour = 18 // 6 PM
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute of [0, 30]) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          slots.push({
            time,
            available: true // In production, check provider availability
          })
        }
      }
      
      setTimeSlots(slots)
    }
  }, [selectedDate])

  useEffect(() => {
    if (selectedDate && selectedTime) {
      const dateTime = new Date(`${selectedDate}T${selectedTime}:00`)
      onSelectDateTime(dateTime)
    }
  }, [selectedDate, selectedTime, onSelectDateTime])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
  }

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <div className="grid grid-cols-2 gap-2">
          {availableDates.map((date) => (
            <button
              key={date}
              type="button"
              onClick={() => {
                setSelectedDate(date)
                setSelectedTime('') // Reset time when date changes
              }}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                selectedDate === date
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-blue-300 text-gray-700'
              }`}
            >
              {formatDate(date)}
            </button>
          ))}
        </div>
      </div>

      {selectedDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Time
          </label>
          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {timeSlots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => setSelectedTime(slot.time)}
                disabled={!slot.available}
                className={`p-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                  selectedTime === slot.time
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : slot.available
                    ? 'border-gray-200 hover:border-blue-300 text-gray-700'
                    : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {formatTime(slot.time)}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedTime && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm font-medium text-green-900">
            📅 Appointment scheduled for:
          </p>
          <p className="text-sm text-green-800 mt-1">
            {formatDate(selectedDate)} at {formatTime(selectedTime)}
          </p>
        </div>
      )}
    </div>
  )
}
