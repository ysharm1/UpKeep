'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProviderDashboardPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      console.error('Dashboard error:', error)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      router.push('/auth/login')
    } finally {
      setLoading(false)
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
          <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your diagnostic visits and repair jobs</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Incoming Bookings</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">2</p>
            <p className="text-sm text-gray-600 mt-1">Diagnostic visits scheduled</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Active Jobs</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">1</p>
            <p className="text-sm text-gray-600 mt-1">Repair quote accepted</p>
          </div>
        </div>

        {/* Incoming Bookings */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Incoming Diagnostic Bookings</h2>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">AC not cooling properly</h3>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">Scheduled</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    AC making loud noise, not cooling. Unit is 5 years old.
                  </p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-gray-500">
                      📅 Tomorrow 2pm
                    </span>
                    <span className="text-xs text-gray-500">
                      📍 San Francisco, CA 94102 • 2.3 miles
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-900">John Smith</span>
                    <span className="text-sm text-gray-600"> • (415) 555-0123</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-green-600">$89</div>
                  <div className="text-xs text-gray-500">Diagnostic fee</div>
                  <div className="text-xs text-green-600 mt-1">✓ Authorized</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/provider/jobs/1/repair-quote"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  Submit Repair Quote
                </Link>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Get Directions
                </button>
              </div>
            </div>

            <div className="px-6 py-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">Kitchen sink draining slowly</h3>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">Scheduled</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Tried drain cleaner but no improvement. Need inspection.
                  </p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-gray-500">
                      📅 Today 5pm
                    </span>
                    <span className="text-xs text-gray-500">
                      📍 San Francisco, CA 94103 • 3.7 miles
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-900">Sarah Johnson</span>
                    <span className="text-sm text-gray-600"> • (415) 555-0456</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-green-600">$89</div>
                  <div className="text-xs text-gray-500">Diagnostic fee</div>
                  <div className="text-xs text-green-600 mt-1">✓ Authorized</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/provider/jobs/2/repair-quote"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  Submit Repair Quote
                </Link>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Get Directions
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Active Jobs</h2>
            <span className="text-sm text-gray-500">Repair quotes accepted</span>
          </div>
          <div className="divide-y divide-gray-200">
            {/* Mock active job with accepted repair quote */}
            <div className="px-6 py-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">Electrical outlets not working</h3>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">In Progress</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Multiple outlets in living room stopped working. Circuit breaker is not tripped.
                  </p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-gray-500">
                      Repair approved 1 day ago
                    </span>
                    <span className="text-xs text-gray-500">
                      📍 San Francisco, CA 94110 • 5.1 miles
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-900">Mike Davis</span>
                    <span className="text-sm text-gray-600"> • (415) 555-0789</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-gray-900">$409</div>
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
                <div className="text-xs text-green-700 ml-6 space-y-1">
                  <div>Diagnostic: $89 • Repair: $320</div>
                  <div>You&apos;ll receive: $347.65 (85%) • Platform fee: $61.35 (15%)</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                  Mark as Complete
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Message Homeowner
                </button>
              </div>
            </div>

            {jobs.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No active jobs</p>
                <p className="text-sm text-gray-400 mt-2">Accepted repair quotes will appear here</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
