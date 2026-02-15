'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProviderDashboardPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [availableJobs, setAvailableJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [claimingJob, setClaimingJob] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchDashboardData(token)
  }, [])

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
      setJobs(data.jobs || [])

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
      fetchDashboardData(token!)
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
                href="/provider/jobs/find"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Find Jobs
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
              <p className="text-gray-600 mt-2">Manage your diagnostic visits and repair jobs</p>
            </div>
            <Link
              href="/provider/jobs/find"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Jobs
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Available Jobs</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {availableJobs.length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Jobs near you waiting to be claimed</p>
            <Link
              href="/provider/jobs/find"
              className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Browse all jobs →
            </Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Scheduled Visits</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {jobs.filter(j => j.status === 'diagnostic_scheduled').length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Diagnostic visits scheduled</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Active Jobs</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {jobs.filter(j => ['repair_approved', 'in_progress'].includes(j.status)).length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Repair quotes accepted</p>
          </div>
        </div>

        {/* Available Jobs - Quick Preview */}
        {availableJobs.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Available Jobs Near You</h2>
                <p className="text-sm text-gray-600 mt-1">Quick preview - see all jobs on the Find Jobs page</p>
              </div>
              <Link
                href="/provider/jobs/find"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                View All Jobs
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {availableJobs.slice(0, 3).map(job => (
                <div key={job.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{job.category.toUpperCase()}</h3>
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">New</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {job.description.substring(0, 150)}...
                      </p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          📍 {job.location?.city}, {job.location?.state} {job.location?.zipCode}
                        </span>
                        <span className="text-xs text-gray-500">
                          🕒 Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleClaimJob(job.id)}
                      disabled={claimingJob === job.id}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:bg-gray-400"
                    >
                      {claimingJob === job.id ? 'Claiming...' : 'Claim Job'}
                    </button>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Diagnostic Visits */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Scheduled Diagnostic Visits</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {jobs.filter(j => j.status === 'diagnostic_scheduled').length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No scheduled visits</p>
                <p className="text-sm text-gray-400 mt-2">New bookings will appear here</p>
              </div>
            ) : (
              jobs.filter(j => j.status === 'diagnostic_scheduled').map(job => (
                <div key={job.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{job.description.substring(0, 50)}...</h3>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">Scheduled</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {job.description.substring(0, 100)}...
                      </p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          📍 {job.location?.city}, {job.location?.state} {job.location?.zipCode}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-900">
                          {job.homeowner?.profile?.firstName} {job.homeowner?.profile?.lastName}
                        </span>
                        <span className="text-sm text-gray-600"> • {job.homeowner?.profile?.phoneNumber}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-green-600">
                        ${job.assignedProvider?.serviceProviderProfile?.diagnosticFee || 0}
                      </div>
                      <div className="text-xs text-gray-500">Diagnostic fee</div>
                      <div className="text-xs text-green-600 mt-1">✓ Authorized</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/provider/jobs/${job.id}/diagnostic-report`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Submit Assessment
                    </Link>
                    <button
                      onClick={() => handleCaptureDiagnostic(job.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      Capture Diagnostic Payment
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Active Jobs</h2>
            <span className="text-sm text-gray-500">Repair quotes accepted</span>
          </div>
          <div className="divide-y divide-gray-200">
            {jobs.filter(j => ['repair_approved', 'in_progress'].includes(j.status)).length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No active jobs</p>
                <p className="text-sm text-gray-400 mt-2">Accepted repair quotes will appear here</p>
              </div>
            ) : (
              jobs.filter(j => ['repair_approved', 'in_progress'].includes(j.status)).map(job => (
                <div key={job.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{job.description.substring(0, 50)}...</h3>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                          {job.status === 'repair_approved' ? 'Approved' : 'In Progress'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {job.description.substring(0, 100)}...
                      </p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          📍 {job.location?.city}, {job.location?.state} {job.location?.zipCode}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-900">
                          {job.homeowner?.profile?.firstName} {job.homeowner?.profile?.lastName}
                        </span>
                        <span className="text-sm text-gray-600"> • {job.homeowner?.profile?.phoneNumber}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-gray-900">
                        ${(job.assignedProvider?.serviceProviderProfile?.diagnosticFee || 0) + (job.repairQuote?.totalAmount || 0)}
                      </div>
                      <div className="text-xs text-gray-500">Total (Diag + Repair)</div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-green-800 font-medium">Both Payments Authorized</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCompleteJob(job.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Mark as Complete
                    </button>
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
