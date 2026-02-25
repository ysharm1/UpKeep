'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface LeadDetail {
  id: string
  category: string
  propertyType: string
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
      const token = localStorage.getItem('accessToken')
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
    const pricing = lead?.propertyType === 'commercial' ? '$80' : lead?.propertyType === 'multi_family' ? '$60' : '$40'
    if (!confirm(`Purchase this lead for ${pricing}? You'll get full customer contact details.`)) return

    setProcessing(true)
    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/leads/${leadId}/view`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Refresh lead data to show full details
        await fetchLead()
        alert('Lead purchased! You can now see full customer details and contact them.')
      } else {
        const error = await response.json()
        setError(error.error || 'Payment failed')
      }
    } catch (error) {
      console.error('Error purchasing lead:', error)
      setError('Payment failed. Please try again.')
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
      {/* Navigation */}
      <nav className="max-w-4xl mx-auto mb-4">
        <Link
          href="/provider/leads"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Lead Marketplace
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto">
        {/* Header - REMOVED, now in nav */}

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
                    💡 Pay {lead.propertyType === 'commercial' ? '$80' : lead.propertyType === 'multi_family' ? '$60' : '$40'} to unlock full details including customer contact information
                  </p>
                  <p className="text-blue-700 text-sm mt-1">
                    Multiple vendors can purchase this lead - call the customer quickly!
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
                      disabled={processing}
                      className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {processing ? 'Processing...' : `Purchase Lead - ${lead.propertyType === 'commercial' ? '$80' : lead.propertyType === 'multi_family' ? '$60' : '$40'}`}
                    </button>
                    <p className="text-sm text-gray-500 text-center mt-3">
                      One-time payment for full customer details. Other vendors may also purchase this lead.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* FULL DETAILS MODE - Already viewed */
              <div>
                <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-6">
                  <p className="text-green-800 font-medium">
                    ✅ You've purchased this lead
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Contact the customer now! Other vendors may have also purchased this lead.
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
