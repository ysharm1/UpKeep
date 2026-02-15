'use client'

import { useState } from 'react'
import SchedulingPicker from './SchedulingPicker'
import StripePaymentForm from './StripePaymentForm'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  provider: {
    id: string
    businessName: string
    diagnosticFee: number
  }
  jobId: string
  onSuccess: () => void
}

export default function BookingModal({ isOpen, onClose, provider, jobId, onSuccess }: BookingModalProps) {
  const [step, setStep] = useState<'schedule' | 'payment'>('schedule')
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleScheduleSelect = (dateTime: Date) => {
    setScheduledDateTime(dateTime)
  }

  const handleContinueToPayment = () => {
    if (!scheduledDateTime) {
      setError('Please select an appointment time')
      return
    }
    setError('')
    setStep('payment')
  }

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    setBooking(true)
    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          providerId: provider.id,
          scheduledDate: scheduledDateTime?.toISOString(),
          paymentMethodId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to book')
      }

      const data = await response.json()
      onSuccess()
      onClose()
    } catch (error: any) {
      setError(error.message)
      setBooking(false)
    }
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
    setBooking(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Book Diagnostic Visit</h2>
            <p className="text-sm text-gray-600 mt-1">{provider.businessName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={booking}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'schedule' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step === 'schedule' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {step === 'payment' ? '✓' : '1'}
              </div>
              <span className="font-medium">Schedule</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="font-medium">Payment</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {step === 'schedule' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Appointment Time
              </h3>
              <SchedulingPicker
                onSelectDateTime={handleScheduleSelect}
                selectedDateTime={scheduledDateTime}
              />
            </div>
          )}

          {step === 'payment' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirm Appointment
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Provider:</strong> {provider.businessName}
                  </p>
                  <p className="text-sm text-blue-900 mt-1">
                    <strong>Date & Time:</strong> {scheduledDateTime?.toLocaleString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Information
              </h3>
              <StripePaymentForm
                amount={provider.diagnosticFee}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                buttonText={booking ? 'Booking...' : `Authorize $${provider.diagnosticFee}`}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          {step === 'schedule' ? (
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleContinueToPayment}
                disabled={!scheduledDateTime}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Continue to Payment →
              </button>
            </div>
          ) : (
            <button
              onClick={() => setStep('schedule')}
              disabled={booking}
              className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              ← Back to Schedule
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
