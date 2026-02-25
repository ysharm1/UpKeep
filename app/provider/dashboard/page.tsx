'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProviderDashboardPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [availableJobs, setAvailableJobs] = useState<any[]>([])
  const [leadStats, setLeadStats] = useState({
    availableLeads: 0,
    viewedLeads: 0,
    wonLeads: 0,
    totalSpent: 0,
  })
  const [loading, setLoading] = useState(true)
  const [claimingJob, setClaimingJob] = useState<string | null>(null)
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
      // Fetch provider's assigned jobs
      const response = await fetch('/api/jobs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const data = await response.json()
      console.log('Provider jobs:', data.jobRequests)
      setJobs(data.jobRequests || [])

      // Fetch available jobs nearby
      const availableResponse = await fetch('/api/jobs/available', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (availableResponse.ok) {
        const availableData = await availableResponse.json()
        setAvailableJobs(availableData.jobs || [])
      }

      // Fetch lead stats
      const leadsResponse = await fetch('/api/leads', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json()
        setLeadStats({
          availableLeads: leadsData.available?.length || 0,
          viewedLeads: leadsData.viewed?.length || 0,
          wonLeads: leadsData.won?.length || 0,
          totalSpent: 0, // Will be calculated from provider profile
        })
      }
    } catch (error) {
      console.error('Dashboard error:', error)
      alert('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimJob = async (jobId: string) => {
    if (!confirm('Claim this job? You will be assigned as the service provider.')) {
      return
    }

    setClaimingJob(jobId)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/jobs/${jobId}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to claim job')
      }

      alert('Job claimed successfully! Contact the homeowner to schedule.')
      // Force full page reload to ensure fresh data
      window.location.reload()
    } catch (error: any) {
      alert(`Failed to claim job: ${error.message}`)
    } finally {
      setClaimingJob(null)
    }
  }

  const handleCaptureDiagnostic = async (jobId: string) => {
    if (!confirm('Capture diagnostic payment? This confirms the visit is complete.')) {
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/jobs/${jobId}/capture-diagnostic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to capture payment')
      }

      alert('Diagnostic payment captured successfully!')
      fetchDashboardData(token!)
    } catch (error: any) {
      alert(`Failed to capture payment: ${error.message}`)
    }
  }

  const handleCompleteJob = async (jobId: string) => {
    if (!confirm('Mark job as complete? This will capture the repair payment.')) {
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/jobs/${jobId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to complete job')
      }

      const result = await response.json()
      alert(`Job completed! You'll receive $${result.payment.providerPayout.toFixed(2)} (85% of total)`)
      fetchDashboardData(token!)
    } catch (error: any) {
      alert(`Failed to complete job: ${error.message}`)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    router.push('/')
  }

  const handleStartConversation = async (jobId: string) => {
    try {
      console.log('Starting conversation for job:', jobId)
      const token = localStorage.getItem('accessToken')
      
      if (!token) {
        alert('Please log in again')
        router.push('/auth/login')
        return
      }
      
      console.log('Creating thread...')
      // Create or get existing thread for this job
      const response = await fetch('/api/messages/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobRequestId: jobId }),
      })

      console.log('Thread response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Thread creation error:', errorData)
        throw new Error(errorData.error || 'Failed to create conversation')
      }

      const data = await response.json()
      console.log('Thread created:', data)
      router.push(`/messages/${data.thread.id}`)
    } catch (error: any) {
      console.error('Start conversation error:', error)
      alert(`Failed to start conversation: ${error.message}`)
    }
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
            <div className="flex items-center">
              <Link href="/provider/dashboard" className="text-2xl font-bold text-blue-600">
                UpKeep Pro
              </Link>
            </div>
            <div className="flex gap-4 items-center">
              <Link
                href="/provider/leads"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Lead Marketplace
              </Link>
              <Link
                href="/provider/leads"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Lead Marketplace
              </Link>
              <Link
                href="/provider/settings"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
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
              <p className="text-gray-600 mt-2">Manage your leads and jobs</p>
            </div>
            <Link
              href="/provider/leads"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              View Leads
            </Link>
          </div>
        </div>

        {/* Lead Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Link href="/provider/leads" className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white hover:shadow-xl transition-shadow">
            <h3 className="text-sm font-medium opacity-90">Available Leads</h3>
            <p className="text-4xl font-bold mt-2">{leadStats.availableLeads}</p>
            <p className="text-sm opacity-75 mt-1">Pay $15 to view</p>
          </Link>
          <Link href="/provider/leads?tab=viewing" className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white hover:shadow-xl transition-shadow">
            <h3 className="text-sm font-medium opacity-90">I'm Viewing</h3>
            <p className="text-4xl font-bold mt-2">{leadStats.viewedLeads}</p>
            <p className="text-sm opacity-75 mt-1">Paid $15 each</p>
          </Link>
          <Link href="/provider/leads?tab=won" className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-lg shadow-lg text-white hover:shadow-xl transition-shadow">
            <h3 className="text-sm font-medium opacity-90">Leads Won</h3>
            <p className="text-4xl font-bold mt-2">{leadStats.wonLeads}</p>
            <p className="text-sm opacity-75 mt-1">Paid $65 each</p>
          </Link>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-90">Win Rate</h3>
            <p className="text-4xl font-bold mt-2">
              {leadStats.viewedLeads > 0 
                ? Math.round((leadStats.wonLeads / leadStats.viewedLeads) * 100) 
                : 0}%
            </p>
            <p className="text-sm opacity-75 mt-1">
              {leadStats.wonLeads} of {leadStats.viewedLeads} viewed
            </p>
          </div>
        </div>

        {/* Job Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Jobs Claimed</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {jobs.filter(j => j.serviceProviderId).length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Jobs you've accepted and are working on</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Completed Jobs</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {jobs.filter(j => j.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Successfully completed jobs</p>
          </div>
        </div>

        {/* Your Accepted Leads */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Accepted Leads</h2>
            <p className="text-sm text-gray-600 mt-1">Leads you've won - contact these homeowners directly</p>
          </div>
          <div className="divide-y divide-gray-200">
            {jobs.filter(j => j.leadStatus === 'accepted' && j.acceptedBy).length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No accepted leads yet</p>
                <p className="text-sm text-gray-400 mt-2">Visit the Lead Marketplace to view and accept leads</p>
                <Link
                  href="/provider/leads"
                  className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Browse Leads
                </Link>
              </div>
            ) : (
              jobs.filter(j => j.leadStatus === 'accepted' && j.acceptedBy).map(job => (
                <div key={job.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{job.category.toUpperCase()}</h3>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded font-semibold">
                          WON - Contact Customer
                        </span>
                        {job.propertyType && job.propertyType !== 'residential' && (
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                            {job.propertyType === 'multi_family' ? 'Multi-Family' : 'Commercial'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {job.description.substring(0, 150)}...
                      </p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          📍 {job.location?.street}, {job.location?.city}, {job.location?.state} {job.location?.zipCode}
                        </span>
                        <span className="text-xs text-gray-500">
                          🕒 Accepted {new Date(job.acceptedAt || job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {job.homeowner && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm font-semibold text-blue-900 mb-1">Customer Contact Info:</p>
                          <div className="text-sm text-blue-800">
                            <p><strong>Name:</strong> {job.homeowner.firstName} {job.homeowner.lastName}</p>
                            <p><strong>Phone:</strong> {job.homeowner.phoneNumber}</p>
                            <p><strong>Email:</strong> {job.homeowner.user?.email}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a
                      href={`tel:${job.homeowner?.phoneNumber}`}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      📞 Call Customer
                    </a>
                    <a
                      href={`sms:${job.homeowner?.phoneNumber}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      💬 Text Customer
                    </a>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    >
                      View Full Details
                    </Link>
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
