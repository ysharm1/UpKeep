'use client'

import { useState } from 'react'

interface PhoneVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onVerified: () => void
  phoneNumber?: string
}

export default function PhoneVerificationModal({
  isOpen,
  onClose,
  onVerified,
  phoneNumber,
}: PhoneVerificationModalProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOpen) return null

  const handleSendCode = async () => {
    setSending(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send code')
      }

      setSuccess('Verification code sent! Check your phone.')
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code')
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Invalid code')
      }

      setSuccess('Phone verified successfully!')
      setTimeout(() => {
        onVerified()
        onClose()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Verify Your Phone</h2>
            <p className="text-sm text-gray-600 mt-1">
              We need to verify your phone number to prevent spam
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {phoneNumber && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Phone:</strong> {phoneNumber}
            </p>
          </div>
        )}

        {!success && (
          <div className="mb-4">
            <button
              onClick={handleSendCode}
              disabled={sending}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {sending ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
              maxLength={6}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the 6-digit code sent to your phone
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
          >
            {loading ? 'Verifying...' : 'Verify Phone'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleSendCode}
            disabled={sending}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
          >
            Didn't receive code? Resend
          </button>
        </div>
      </div>
    </div>
  )
}
