'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface ProviderCardProps {
  provider: string
  rating: number
  reviews: number
  distance: number
  diagnosticFee: number
  availability: string
  typicalRange?: string
}

function ProviderCard({ provider, rating, reviews, distance, diagnosticFee, availability, typicalRange }: ProviderCardProps) {
  const [booking, setBooking] = useState(false)

  const handleBook = () => {
    setBooking(true)
    // Simulate API call
    setTimeout(() => {
      alert(`Diagnostic visit booked! Payment of $${diagnosticFee} authorized.\n\n${provider} will arrive ${availability}.`)
      setBooking(false)
    }, 1500)
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h4 className="font-semibold text-xl text-gray-900">{provider}</h4>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <div className="flex text-yellow-400 text-sm">
                {'★'.repeat(Math.floor(rating))}
                {rating % 1 !== 0 && '☆'}
              </div>
              <span className="text-sm text-gray-600">{rating} ({reviews} reviews)</span>
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded font-medium">Verified</span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span>📍 {distance} miles away</span>
            <span>🕒 {availability}</span>
          </div>
        </div>
        
        <div className="text-right ml-6">
          <div className="text-sm text-gray-500 mb-1">Diagnostic Visit</div>
          <div className="text-3xl font-bold text-gray-900">${diagnosticFee}</div>
        </div>
      </div>

      {typicalRange && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Typical repair range:</strong> {typicalRange}
            <span className="block text-xs text-blue-600 mt-1">Final quote provided after inspection</span>
          </p>
        </div>
      )}

      <button
        onClick={handleBook}
        disabled={booking}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg disabled:opacity-50 transition-colors"
      >
        {booking ? 'Booking...' : `Book Diagnostic Visit - $${diagnosticFee}`}
      </button>
      
      <p className="text-xs text-gray-500 text-center mt-2">
        Payment authorized now, charged after visit
      </p>
    </div>
  )
}

export default function FindProfessionalsPage() {
  const router = useRouter()
  const params = useParams()
  const problemId = params.id as string

  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      console.error('Job details error:', error)
      alert('Failed to load problem details')
      router.push('/dashboard')
    } finally {
      setLoading(false)
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
              <span className="text-sm text-gray-500">Sorted by availability</span>
            </div>
            
            <ProviderCard
              provider="Cool Air Services"
              rating={4.9}
              reviews={38}
              distance={3.7}
              diagnosticFee={75}
              availability="Available today 5pm"
              typicalRange="$200-600 for most repairs"
            />

            <ProviderCard
              provider="Quick Fix HVAC"
              rating={4.8}
              reviews={42}
              distance={2.3}
              diagnosticFee={89}
              availability="Available tomorrow 2pm"
              typicalRange="$250-700 depending on issue"
            />

            <ProviderCard
              provider="Pro Climate Control"
              rating={4.7}
              reviews={29}
              distance={5.1}
              diagnosticFee={95}
              availability="Available next week"
              typicalRange="$300-800 for typical jobs"
            />
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
