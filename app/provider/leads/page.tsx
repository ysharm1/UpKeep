'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

interface Lead {
  id: string
  category: string
  propertyType: string
  location: string
  preview: string
  createdAt: string
  viewCount: number
  competitorCount: number
}

interface PurchasedLead {
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
  customer: {
    name: string
    phone: string
    email: string
  }
  photos: string[]
  createdAt: string
  viewCount: number
}

export default function LeadsPage() {
  const [available, setAvailable] = useState<Lead[]>([])
  const [purchased, setPurchased] = useState<PurchasedLead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'available' | 'purchased'>('available')

  const getPrice = (propertyType: string) => {
    if (propertyType === 'commercial') return '$80'
    if (propertyType === 'multi_family') return '$60'
    return '$40'
  }

  const getPropertyTypeLabel = (propertyType: string) => {
    if (propertyType === 'commercial') return 'Commercial'
    if (propertyType === 'multi_family') return 'Multi-Family'
    return 'Residential'
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/leads', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAvailable(data.available || [])
        setPurchased(data.viewed || [])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leads...</p>
        </div>
      </div>
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
              <Link href="/provider/dashboard" className="px-4 py-2 text-gray-700 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/provider/settings" className="px-4 py-2 text-gray-700 hover:text-gray-900">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lead Marketplace</h1>
          <p className="mt-2 text-gray-600">
            Browse available leads and contact customers you've purchased
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`${
                activeTab === 'available'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Available ({available.length})
            </button>
            <button
              onClick={() => setActiveTab('purchased')}
              className={`${
                activeTab === 'purchased'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Purchased ({purchased.length})
            </button>
          </nav>
        </div>

        {/* Available Leads */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            {available.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No available leads at the moment</p>
                <p className="text-sm text-gray-400 mt-2">Check back soon for new opportunities</p>
                <p className="text-sm text-gray-400 mt-1">
                  Make sure your specialties are configured in{' '}
                  <Link href="/provider/settings" className="text-blue-600 hover:text-blue-700">
                    Settings
                  </Link>
                </p>
              </div>
            ) : (
              available.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/provider/leads/${lead.id}`}
                  className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {lead.category.toUpperCase()}
                        </span>
                        {lead.propertyType !== 'residential' && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {getPropertyTypeLabel(lead.propertyType)}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">{lead.location}</span>
                        <span className="text-sm text-gray-400">{formatDate(lead.createdAt)}</span>
                      </div>
                      <p className="text-gray-700 mb-3">{lead.preview}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>👁️ {lead.viewCount} purchased</span>
                        <span>🔥 {lead.competitorCount} competing</span>
                      </div>
                    </div>
                    <div className="ml-6">
                      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                        Purchase - {getPrice(lead.propertyType)}
                      </button>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Purchased Leads */}
        {activeTab === 'purchased' && (
          <div className="space-y-4">
            {purchased.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">You haven't purchased any leads yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Purchase available leads to get full customer contact details
                </p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Browse Available Leads
                </button>
              </div>
            ) : (
              purchased.map((lead) => (
                <div key={lead.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {lead.category.toUpperCase()}
                        </span>
                        {lead.propertyType !== 'residential' && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {getPropertyTypeLabel(lead.propertyType)}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {lead.location.city}, {lead.location.state}
                        </span>
                        <span className="text-sm text-gray-400">{formatDate(lead.createdAt)}</span>
                      </div>
                      <p className="text-gray-700 mb-2">{lead.description}</p>
                      <p className="text-xs text-gray-500">
                        📍 {lead.location.street}, {lead.location.city}, {lead.location.state} {lead.location.zipCode}
                      </p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Customer Details:</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Name</span>
                        <p className="font-medium">{lead.customer.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone</span>
                        <p className="font-medium">
                          <a href={`tel:${lead.customer.phone}`} className="text-blue-600 hover:text-blue-700">
                            {lead.customer.phone}
                          </a>
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Email</span>
                        <p className="font-medium">
                          <a href={`mailto:${lead.customer.email}`} className="text-blue-600 hover:text-blue-700">
                            {lead.customer.email}
                          </a>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`tel:${lead.customer.phone}`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        📞 Call Now
                      </a>
                      <a
                        href={`sms:${lead.customer.phone}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        💬 Text
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
