'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  createdAt: string
}

export default function ProviderDashboardPage() {
  const router = useRouter()
  const [purchasedLeads, setPurchasedLeads] = useState<PurchasedLead[]>([])
  const [leadStats, setLeadStats] = useState({
    availableLeads: 0,
    purchasedLeads: 0,
  })
  const [providerStats, setProviderStats] = useState({
    totalLeadsViewed: 0,
    totalSpent: 0,
  })
  const [loading, setLoading] = useState(true)
  const [hasPaymentMethod, setHasPaymentMethod] = useState(true)
  const [hasSpecialties, setHasSpecialties] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchDashboardData(token)
  }, [mounted])

  const fetchDashboardData = async (token: string) => {
    try {
      // Fetch provider profile for all-time stats
      const profileResponse = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        const profile = profileData.user?.serviceProviderProfile
        if (profile) {
          setProviderStats({
            totalLeadsViewed: profile.totalLeadsViewed || 0,
            totalSpent: profile.totalSpent || 0,
          })
          setHasPaymentMethod(!!profile.stripeCustomerId)
          setHasSpecialties(profile.specialties && profile.specialties.length > 0)
        }
      }

      // Fetch leads data
      const leadsResponse = await fetch('/api/leads', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json()
        setLeadStats({
          availableLeads: leadsData.available?.length || 0,
          purchasedLeads: leadsData.viewed?.length || 0,
        })
        setPurchasedLeads(leadsData.viewed || [])
      }
    } catch (error) {
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    router.push('/')
  }

  const getPropertyTypeLabel = (type: string) => {
    if (type === 'commercial') return 'Commercial'
    if (type === 'multi_family') return 'Multi-Family'
    return 'Residential'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/provider/dashboard" className="text-2xl font-bold text-blue-600">
              UpKeep Pro
            </Link>
            <div className="flex gap-4 items-center">
              <Link href="/provider/leads" className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium">
                Lead Marketplace
              </Link>
              <Link href="/provider/settings" className="px-4 py-2 text-gray-700 hover:text-gray-900">
                Settings
              </Link>
              <button onClick={handleLogout} className="px-4 py-2 text-gray-700 hover:text-gray-900">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your leads and track your performance</p>
            </div>
            <Link
              href="/provider/leads"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Browse Leads
            </Link>
          </div>
        </div>

        {/* Setup Prompts */}
        {(!hasPaymentMethod || !hasSpecialties) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Complete your setup to start getting leads:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              {!hasSpecialties && (
                <li>
                  → <Link href="/provider/settings" className="underline font-medium">Select your service specialties</Link> so you can see matching leads
                </li>
              )}
              {!hasPaymentMethod && (
                <li>
                  → <Link href="/provider/settings" className="underline font-medium">Add a payment method</Link> so you can purchase leads
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/provider/leads"
            className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white hover:shadow-xl transition-shadow"
          >
            <h3 className="text-sm font-medium opacity-90">Available Leads</h3>
            <p className="text-4xl font-bold mt-2">{leadStats.availableLeads}</p>
            <p className="text-sm opacity-75 mt-1">Starting at $40 each</p>
          </Link>
          <Link
            href="/provider/leads?tab=purchased"
            className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white hover:shadow-xl transition-shadow"
          >
            <h3 className="text-sm font-medium opacity-90">Purchased Leads</h3>
            <p className="text-4xl font-bold mt-2">{leadStats.purchasedLeads}</p>
            <p className="text-sm opacity-75 mt-1">Contact these customers</p>
          </Link>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Total Invested</h3>
            <p className="text-4xl font-bold mt-2">${(providerStats.totalSpent / 100).toFixed(0)}</p>
            <p className="text-sm opacity-75 mt-1">All-time spending</p>
          </div>
        </div>

        {/* Lead Analytics */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Lead Analytics</h2>
            <p className="text-sm text-gray-600 mt-1">Your all-time performance metrics</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">{providerStats.totalLeadsViewed}</p>
              <p className="text-sm text-gray-600 mt-1">Total Leads Purchased</p>
              <p className="text-xs text-gray-500 mt-1">$40–$80 per lead</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">${(providerStats.totalSpent / 100).toFixed(0)}</p>
              <p className="text-sm text-gray-600 mt-1">Total Invested</p>
              <p className="text-xs text-gray-500 mt-1">All-time spending</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                ${providerStats.totalLeadsViewed > 0
                  ? ((providerStats.totalSpent / 100) / providerStats.totalLeadsViewed).toFixed(2)
                  : '0.00'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Avg Cost Per Lead</p>
              <p className="text-xs text-gray-500 mt-1">Total / Purchased</p>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Shared lead model: multiple providers can purchase the same lead</span>
              </div>
              <Link href="/provider/leads" className="text-blue-600 hover:text-blue-700 font-medium">
                Browse Leads →
              </Link>
            </div>
          </div>
        </div>

        {/* Purchased Leads */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Purchased Leads</h2>
            <p className="text-sm text-gray-600 mt-1">Contact these homeowners directly to win their business</p>
          </div>
          <div className="divide-y divide-gray-200">
            {purchasedLeads.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No purchased leads yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Visit the Lead Marketplace to find and purchase leads in your area
                </p>
                <Link
                  href="/provider/leads"
                  className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Browse Leads
                </Link>
              </div>
            ) : (
              purchasedLeads.map((lead) => (
                <div key={lead.id} className="px-6 py-5 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {lead.category.toUpperCase()}
                      </span>
                      {lead.propertyType !== 'residential' && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {getPropertyTypeLabel(lead.propertyType)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2 line-clamp-2">{lead.description}</p>
                  <p className="text-xs text-gray-500 mb-3">
                    📍 {lead.location.street}, {lead.location.city}, {lead.location.state} {lead.location.zipCode}
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Customer:</p>
                    <div className="grid grid-cols-3 gap-2 text-sm text-blue-800">
                      <span><strong>{lead.customer.name}</strong></span>
                      <a href={`tel:${lead.customer.phone}`} className="hover:underline">{lead.customer.phone}</a>
                      <a href={`mailto:${lead.customer.email}`} className="hover:underline truncate">{lead.customer.email}</a>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${lead.customer.phone}`}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      📞 Call
                    </a>
                    <a
                      href={`sms:${lead.customer.phone}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      💬 Text
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
