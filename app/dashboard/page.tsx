'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
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
      // Fetch jobs
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
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                UpKeep
              </Link>
            </div>
            <div className="flex gap-4 items-center">
              <Link
                href="/jobs/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                New Job Request
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
          <p className="text-gray-600 mt-2">Manage your job requests and services</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Jobs</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{jobs.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Active Jobs</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {jobs.filter(j => !['completed', 'cancelled'].includes(j.status)).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Completed</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {jobs.filter(j => j.status === 'completed').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Job Requests</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {jobs.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No job requests yet</p>
                <Link
                  href="/jobs/new"
                  className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Your First Job Request
                </Link>
              </div>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{job.category}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {job.description.substring(0, 100)}...
                      </p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            job.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : job.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Details →
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
