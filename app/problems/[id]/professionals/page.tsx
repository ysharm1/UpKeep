'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import BookingModal from '@/app/components/BookingModal'

interface Provider {
  id: string
  businessName: string
  rating: number
  reviewCount: number
  distance: number
  diagnosticFee: number
  isVerified: boolean
  specialties: string[]
  activeJobsCount: number
  isAvailable: boolean
  estimatedResponseHours: number
}

interface ProviderCardProps {
  provider: Provider
  jobId: string
  onBookingSuccess: () => void
}

function ProviderCard({ provider, jobId, onBookingSuccess }: ProviderCardProps) {
  const router = useRouter()
  const [showBookingModal, setShowBookingModal] = useState(false)

  const handleBookingSuccess = () => {
    setShowBookingModal(false)
    alert(`Diagnostic visit booked with ${provider.businessName}!\n\nYou'll receive a confirmation email shortly.`)
    onBookingSuccess()
    router.push(`/jobs/${jobId}`)
  }

  return (
    <>
      <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-xl text-gray-900">{provider.businessName}</h4>
              {provider.isAvailable && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded font-medium">Available</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <div className="flex text-yellow-400 text-sm">
                  {'★'.repeat(Math.floor(provider.rating))}
                  {provider.rating % 1 !== 0 && '☆'}
                </div>
                <span className="text-sm text-gray-600">{provider.rating} ({provider.reviewCount} reviews)</span>
              </div>
              {provider.isVerified && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded font-medium">Verified</span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>📍 {provider.distance.toFixed(1)} miles away</span>
              <span>🕒 Responds in ~{provider.estimatedResponseHours}hrs</span>
            </div>
            {!provider.isAvailable && (
              <div className="mt-2 text-xs text-orange-600">
                ⚠️ Currently busy with {provider.activeJobsCount} jobs
              </div>
            )}
          </div>

          <div className="text-right ml-6">
            <div className="text-sm text-gray-500 mb-1">Diagnostic Visit</div>
            <div className="text-3xl font-bold text-gray-900">${provider.diagnosticFee}</div>
          </div>
        </div>

        <button
          onClick={() => setShowBookingModal(true)}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors"
        >
          Book Diagnostic Visit - ${provider.diagnosticFee}
        </button>

        <p className="text-xs text-gray-500 text-center mt-2">
          Payment authorized now, charged after visit
        </p>
      </div>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        provider={provider}
        jobId={jobId}
        onSuccess={handleBookingSuccess}
      />
    </>
  )
}

export default function FindProfessionalsPage() {
  const router = useRouter()
  const params = useParams()
  const problemId = params.id as string

  const [job, setJob] = useState<any>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [providersLoading, setProvidersLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchJobDetails(token)
  }, [problemId])

  const fetchJobDetails = async (token: string) => {
    try {
      const response = await fetch(`/api/jobs/${problemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch job details')
      }

      const data = await response.json()
      setJob(data.jobRequest)
      
      // Fetch nearby providers
      if (data.jobRequest.location) {
        fetchNearbyProviders(token, data.jobRequest)
      }
    } catch (error) {
      console.error('Job details error:', error)
      alert('Failed to load problem details')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchNearbyProviders = async (token: string, jobData: any) => {
    try {
      const { latitude, longitude } = jobData.location
      const response = await fetch(
        `/api/providers/nearby?lat=${latitude}&lng=${longitude}&category=${jobData.category}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch providers')
      }

      const data = await response.json()
      setProviders(data.providers || [])
    } catch (error) {
      console.error('Providers error:', error)
      alert('Failed to load nearby providers')
    } finally {
      setProvidersLoading(false)
    }
  }

  const handleBookingSuccess = () => {
    // Refresh job details after booking
    const token = localStorage.getItem('accessToken')
    if (token) {
      fetchJobDetails(token)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding professionals...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Problem not found</p>
          <Link href="/dashboard" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                UpKeep
              </Link>
            </div>
            <Link
              href={`/jobs/${problemId}`}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              ← Back to Problem Details
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Book a Diagnostic Visit</h2>
          <p className="text-gray-600 mb-6">
            Verified {job.category} professionals near you. They&apos;ll diagnose your problem and provide a repair quote on-site.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Your Problem:</strong> {job.description.substring(0, 150)}...
            </p>
            <p className="text-sm text-blue-800 mt-2">
              <strong>Location:</strong> {job.location?.city}, {job.location?.state} {job.location?.zipCode}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-gray-900">Available Professionals</h3>
              <span className="text-sm text-gray-500">Sorted by distance</span>
            </div>
            
            {providersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading providers...</p>
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No providers available in your area yet.</p>
                <p className="text-sm text-gray-500 mt-2">We&apos;re working on expanding our network!</p>
              </div>
            ) : (
              providers.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  jobId={problemId}
                  onBookingSuccess={handleBookingSuccess}
                />
              ))
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">💡 How it works</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Book a diagnostic visit - payment authorized but not charged yet</li>
              <li>• Professional arrives and inspects your problem</li>
              <li>• You receive a repair quote in the app</li>
              <li>• Approve the quote and they complete the work</li>
              <li>• Payment captured only after work is done</li>
            </ul>
          </div>

          <div className="border-t pt-6">
            <div className="flex gap-4">
              <Link
                href={`/problems/${problemId}/chat`}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                ← Back to AI Chat
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
