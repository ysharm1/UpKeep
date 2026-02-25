'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Lead {
  id: string
  category: string
  location: string
  preview: string
  createdAt: string
  viewCount: number
  competitorCount: number
}

interface ViewedLead {
  id: string
  category: string
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
  leadStatus: string
}

interface WonLead {
  id: string
  category: string
  location: string
  customer: {
    name: string
    phone: string
    email: string
  }
  acceptedAt: string
}

export default function LeadsPage() {
  const router = useRouter()
  const [available, setAvailable] = useState<Lead[]>([])
  const [viewed, setViewed] = useState<ViewedLead[]>([])
  const [won, setWon] = useState<WonLead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'available' | 'viewing' | 'won'>('available')

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
        setAvailable(data.available)
        setViewed(data.viewed)
        setWon(data.won)
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
              <Link
                href="/provider/dashboard"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/provider/settings"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
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
            View available leads, track your progress, and manage won jobs
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
              onClick={() => setActiveTab('viewing')}
              className={`${
                activeTab === 'viewing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              I'm Viewing ({viewed.length})
            </button>
            <button
              onClick={() => setActiveTab('won')}
              className={`${
                activeTab === 'won'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Won ({won.length})
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
                        <span className="text-sm text-gray-500">{lead.location}</span>
                        <span className="text-sm text-gray-400">{formatDate(lead.createdAt)}</span>
                      </div>
                      <p className="text-gray-700 mb-3">{lead.preview}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>👁️ {lead.viewCount} views</span>
                        <span>🔥 {lead.competitorCount} competing</span>
                      </div>
                    </div>
                    <div className="ml-6">
                      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                        Pay $15 to View
                      </button>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Viewing Leads */}
        {activeTab === 'viewing' && (
          <div className="space-y-4">
            {viewed.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">You haven't viewed any leads yet</p>
                <p className="text-sm text-gray-400 mt-2">View available leads to get started</p>
              </div>
            ) : (
              viewed.map((lead) => (
                <div key={lead.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {lead.category.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {lead.location.city}, {lead.location.state}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{lead.description}</p>
                    </div>
                    {lead.leadStatus === 'viewed' && (
                      <Link
                        href={`/provider/leads/${lead.id}`}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                      >
                        Accept - $50
                      </Link>
                    )}
                    {lead.leadStatus === 'accepted' && (
                      <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                        Accepted by another pro
                      </span>
                    )}
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Customer Details:</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <p className="font-medium">{lead.customer.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <p className="font-medium">{lead.customer.phone}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="font-medium">{lead.customer.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Won Leads */}
        {activeTab === 'won' && (
          <div className="space-y-4">
            {won.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">You haven't won any leads yet</p>
                <p className="text-sm text-gray-400 mt-2">Be the first to accept available leads</p>
              </div>
            ) : (
              won.map((lead) => (
                <div key={lead.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          {lead.category.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">{lead.location}</span>
                        <span className="text-sm text-green-600 font-medium">✓ Won</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Customer:</span>
                          <p className="font-medium">{lead.customer.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <p className="font-medium">{lead.customer.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <p className="font-medium">{lead.customer.email}</p>
                        </div>
                      </div>
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
