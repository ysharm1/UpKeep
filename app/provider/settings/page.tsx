'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProviderSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [profileId, setProfileId] = useState('')
  
  const [diagnosticFee, setDiagnosticFee] = useState('89')

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    // Get user profile to get provider ID
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.user?.serviceProviderProfile) {
            setProfileId(data.user.serviceProviderProfile.id)
            if (data.user.serviceProviderProfile.diagnosticFee) {
              setDiagnosticFee(data.user.serviceProviderProfile.diagnosticFee.toString())
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      }
    }

    fetchProfile()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    setError('')

    const token = localStorage.getItem('accessToken')
    if (!token || !profileId) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const fee = parseFloat(diagnosticFee)
    if (fee < 50 || fee > 150) {
      setError('Diagnostic fee must be between $50 and $150')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/providers/${profileId}/diagnostic-fee`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ diagnosticFee: fee })
      })

      const data = await response.json()

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(data.error?.message || 'Failed to save diagnostic fee')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Failed to update diagnostic fee:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/provider/dashboard" className="text-2xl font-bold text-blue-600">
                UpKeep Pro
              </Link>
            </div>
            <Link
              href="/provider/dashboard"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Diagnostic Visit Fee</h1>
          <p className="text-gray-600 mb-6">
            Set your fee for diagnostic visits. This is what homeowners pay to book you for an inspection.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
            <p className="text-sm text-blue-800">
              💡 <strong>How it works:</strong> Homeowners book and pay your diagnostic fee upfront. After you inspect the problem, you submit a repair quote through the app.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnostic Visit Fee
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500 text-lg">$</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={diagnosticFee}
                  onChange={(e) => setDiagnosticFee(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="89"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Typical range: $50-150 depending on your market and expertise
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">What&apos;s included:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Travel to customer location</li>
                <li>✓ Problem inspection and diagnosis</li>
                <li>✓ Detailed repair quote provided on-site</li>
                <li>✓ Payment guaranteed if you show up</li>
              </ul>
            </div>

            <div className="border-t pt-6">
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Diagnostic Fee'}
                </button>
                <Link
                  href="/provider/dashboard"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </Link>
              </div>
              {saved && (
                <p className="text-green-600 text-sm mt-2">✓ Diagnostic fee saved successfully!</p>
              )}
              {error && (
                <p className="text-red-600 text-sm mt-2">✗ {error}</p>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
