'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const PaymentMethodSetup = dynamic(() => import('@/app/components/PaymentMethodSetup'), {
  ssr: false,
})

export default function ProviderSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [profileId, setProfileId] = useState('')
  const [showPaymentSetup, setShowPaymentSetup] = useState(false)
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false)
  
  const [specialties, setSpecialties] = useState<string[]>([])
  const [businessName, setBusinessName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')

  const availableSpecialties = ['hvac', 'plumbing', 'electrical', 'general_maintenance']

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
            const profile = data.user.serviceProviderProfile
            setProfileId(profile.id)
            setHasPaymentMethod(!!profile.stripeCustomerId)
            if (profile.specialties) {
              setSpecialties(profile.specialties)
            }
            if (profile.businessName) {
              setBusinessName(profile.businessName)
            }
            if (profile.phoneNumber) {
              setPhoneNumber(profile.phoneNumber)
            }
            if (profile.licenseNumber) {
              setLicenseNumber(profile.licenseNumber)
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

    try {
      const response = await fetch(`/api/providers/${profileId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          specialties,
          businessName,
          phoneNumber,
          licenseNumber
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(data.error?.message || 'Failed to save profile')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Failed to update profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleSpecialty = (specialty: string) => {
    setSpecialties(prev => 
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/provider/dashboard" className="text-2xl font-bold text-blue-600">
              UpKeep Pro
            </Link>
            <div className="flex gap-4">
              <Link
                href="/provider/dashboard"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/provider/leads"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Lead Marketplace
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Provider Settings</h1>
          <p className="text-gray-600 mb-6">
            Manage your business information and service specialties.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Information */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ABC Plumbing Services"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="LIC-12345"
                  />
                </div>
              </div>
            </div>

            {/* Specialties */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Specialties</h2>
              <p className="text-sm text-gray-600 mb-4">
                Select all services you provide. You'll see leads matching these categories.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {availableSpecialties.map((specialty) => (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() => toggleSpecialty(specialty)}
                    className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${
                      specialties.includes(specialty)
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        specialties.includes(specialty)
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {specialties.includes(specialty) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium capitalize">
                        {specialty.replace('_', ' ')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Payment Method</h2>
              <p className="text-sm text-gray-600 mb-4">
                Add a payment method to purchase leads. You'll be charged when you view or accept leads.
              </p>

              {hasPaymentMethod && !showPaymentSetup ? (
                <div className="bg-green-50 border-l-4 border-green-600 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-green-800 font-medium">✓ Payment method on file</p>
                      <p className="text-green-700 text-sm mt-1">You're ready to purchase leads</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPaymentSetup(true)}
                      className="px-4 py-2 text-sm bg-white border border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                    >
                      Update
                    </button>
                  </div>
                </div>
              ) : !showPaymentSetup ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4">
                  <p className="text-yellow-800 font-medium mb-3">⚠️ No payment method on file</p>
                  <button
                    type="button"
                    onClick={() => setShowPaymentSetup(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Add Payment Method
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <PaymentMethodSetup
                    onSuccess={() => {
                      setShowPaymentSetup(false)
                      setHasPaymentMethod(true)
                      alert('Payment method saved successfully!')
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPaymentSetup(false)}
                    className="mt-4 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
                <Link
                  href="/provider/dashboard"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </Link>
              </div>
              {saved && (
                <p className="text-green-600 text-sm mt-2">✓ Settings saved successfully!</p>
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
