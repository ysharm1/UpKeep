'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
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
      // First, validate the token and get user info
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data')
      }

      const userData = await userResponse.json()
      
      // Redirect service providers to their dashboard
      if (userData.user.role === 'service_provider') {
        router.push('/provider/dashboard')
        return
      }

      // Fetch jobs for homeowners
      const response = await fetch('/api/jobs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const data = await response.json()
      setJobs(data.jobRequests || [])
      
      // Debug: Show job statuses
      const jobStatuses = data.jobRequests?.map((j: any) => `${j.status} (hasProvider: ${!!j.serviceProviderId})`).join(', ')
      console.log('=== HOMEOWNER DASHBOARD JOBS ===')
      console.log('Total jobs:', data.jobRequests?.length)
      console.log('Job statuses:', jobStatuses)
      console.log('Full jobs data:', data.jobRequests)
      console.log('================================')
    } catch (error) {
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeJobs = jobs.filter(job => 
    job.status !== 'completed' && job.status !== 'cancelled' && job.status !== 'resolved_diy'
  )
  
  const archivedJobs = jobs.filter(job => 
    job.status === 'completed' || job.status === 'cancelled' || job.status === 'resolved_diy'
  )

  const displayedJobs = showArchived ? archivedJobs : activeJobs

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
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                UpKeep
              </Link>
            </div>
            <div className="flex gap-4 items-center">
              <Link
                href="/messages"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Messages
              </Link>
              <Link
                href="/problems/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Get Help with a Problem
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Your home repair problems and solutions</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Problems</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{jobs.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Solved with AI</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {jobs.filter(j => j.status === 'resolved_diy').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Professional Help</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {jobs.filter(j => ['pending_match', 'matched', 'accepted', 'in_progress', 'completed'].includes(j.status)).length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Your Home Problems</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowArchived(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    !showArchived
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active ({activeJobs.length})
                </button>
                <button
                  onClick={() => setShowArchived(true)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    showArchived
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Past ({archivedJobs.length})
                </button>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {displayedJobs.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">
                  {showArchived ? 'No past problems' : 'No active problems'}
                </p>
                {!showArchived && (
                  <Link
                    href="/problems/new"
                    className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Describe Your Problem
                  </Link>
                )}
              </div>
            ) : (
              displayedJobs.map(job => (
                <div key={job.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{job.category}</h3>
                        {job.status === 'pending_match' && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                            3 Quotes Received
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {job.description.substring(0, 100)}...
                      </p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            job.status === 'resolved_diy'
                              ? 'bg-green-100 text-green-800'
                              : job.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : job.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : job.status === 'ai_diagnosis'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {job.status === 'resolved_diy' ? 'Solved with AI' : 
                           job.status === 'ai_diagnosis' ? 'AI Diagnosing' :
                           job.status === 'pending_match' ? 'Review Quotes' :
                           job.status === 'matched' ? 'Professional Found' :
                           job.status}
                        </span>
                      </div>
                    </div>
                    {(() => {
                      console.log(`Job ${job.id} status: "${job.status}" (type: ${typeof job.status})`)
                      if (job.status === 'matched') {
                        return (
                          <Link
                            href={`/jobs/${job.id}/pay-diagnostic`}
                            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
                          >
                            Pay for Diagnostic ($85)
                          </Link>
                        )
                      } else {
                        return (
                          <Link
                            href={job.status === 'pending_match' ? `/problems/${job.id}/professionals` : `/jobs/${job.id}`}
                            className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
                          >
                            {job.status === 'pending_match' ? 'View Quotes →' : 'View Details →'}
                          </Link>
                        )
                      }
                    })()}
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
