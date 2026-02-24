'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface LeadDetail {
  id: string
  category: string
  description: string
  location: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  customer?: {
    name: string
    phone: string
    email: string
  }
  photos: string[]
  createdAt: string
  viewCount: number
  leadStatus: string
  hasViewed: boolean
}

export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const leadId = params.id as string

  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchLead()
  }, [leadId])

  const fetchLead = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/leads/${leadId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLead(data.lead)
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to load lead')
      }
    } catch (error) {
      console.error('Error fetching lead:', error)
      setError('Failed to load lead')
    } finally {
      setLoading(false)
    }
  }

  const handleViewLead = async () => {
    if (!confirm('Pay $15 to view full lead details?')) return

    setProcessing(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/leads/${leadId}/view`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Refresh lead data to show full details
        await fetchLead()
        alert('Lead unlocked! You can now see customer details.')
      } else {
        const error = await response.json()
        setError(error.error || 'Payment failed')
      }
    } catch (error) {
      console.error('Error viewing lead:', error)
      setError('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleAcceptLead = async () => {
    if (!confirm('Pay $50 to accept this lead exclusively? Total cost: $65')) return

    setProcessing(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/leads/${leadId}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Lead accepted! Customer: ${data.customer.name}, Phone: ${data.customer.phone}`)
        router.push('/provider/leads?tab=won')
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to accept lead')
      }
    } catch (error) {
      console.error('Error accepting lead:', error)
      setError('Failed to accept lead. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading lead...</p>
        </div>
      </div>
    )
  }

  if (error && !lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/provider/leads"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Leads
          </Link>
        </div>
      </div>
    )
  }

  if (!lead) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/provider/leads"
            className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Leads
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Lead Status Badge */}
        {lead.leadStatus === 'accepted' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 mb-6">
            <p className="text-yellow-800 font-medium">
              ⚠️ This lead has been accepted by another provider
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">{lead.category.toUpperCase()} Lead</h1>
                <p className="text-blue-100">
                  {lead.location.city}, {lead.location.state}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-100">Posted</div>
                <div className="font-medium">{formatDate(lead.createdAt)}</div>
              </div>
            </div>
          </div>

          {/* Preview or Full Details */}
          <div className="p-6">
            {!lead.hasViewed ? (
              /* PREVIEW MODE - Not yet viewed */
              <div>
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
                  <p className="text-blue-800 font-medium">
                    💡 Pay $15 to unlock full details including customer contact information
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview</h3>
                    <p className="text-gray-700">{lead.description.substring(0, 150)}...</p>
                    <p className="text-sm text-gray-500 mt-2 italic">
                      Full description available after payment
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
                    <p className="text-gray-700">
                      {lead.location.city}, {lead.location.state} {lead.location.zipCode}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 italic">
                      Full address available after payment
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Competition</h3>
                    <p className="text-gray-700">
                      {lead.viewCount} {lead.viewCount === 1 ? 'provider has' : 'providers have'} viewed this lead
                    </p>
                  </div>

                  {/* Payment Button */}
                  <div className="border-t pt-6">
                    <button
                      onClick={handleViewLead}
                      disabled={processing || lead.leadStatus === 'accepted'}
                      className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {processing ? 'Processing...' : 'Pay $15 to View Full Details'}
                    </button>
                    <p className="text-sm text-gray-500 text-center mt-3">
                      You'll be charged $15 to see customer name, phone, email, photos, and full description
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* FULL DETAILS MODE - Already viewed */
              <div>
                <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-6">
                  <p className="text-green-800 font-medium">
                    ✅ You've unlocked this lead for $15
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Customer Details */}
                  {lead.customer && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Contact</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-600">Name:</span>
                          <p className="font-medium text-gray-900">{lead.customer.name}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Phone:</span>
                          <p className="font-medium text-gray-900">
                            <a href={`tel:${lead.customer.phone}`} className="text-blue-600 hover:text-blue-700">
                              {lead.customer.phone}
                            </a>
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Email:</span>
                          <p className="font-medium text-gray-900">
                            <a href={`mailto:${lead.customer.email}`} className="text-blue-600 hover:text-blue-700">
                              {lead.customer.email}
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Full Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Problem Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{lead.description}</p>
                  </div>

                  {/* Full Address */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Address</h3>
                    <p className="text-gray-700">
                      {lead.location.street}<br />
                      {lead.location.city}, {lead.location.state} {lead.location.zipCode}
                    </p>
                  </div>

                  {/* Photos */}
                  {lead.photos && lead.photos.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Photos</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {lead.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Problem photo ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accept Button */}
                  {lead.leadStatus !== 'accepted' && (
                    <div className="border-t pt-6">
                      <button
                        onClick={handleAcceptLead}
                        disabled={processing}
                        className="w-full px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {processing ? 'Processing...' : 'Accept This Lead - $50'}
                      </button>
                      <p className="text-sm text-gray-500 text-center mt-3">
                        Total cost: $65 ($15 view + $50 accept). You'll get exclusive access to this customer.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
