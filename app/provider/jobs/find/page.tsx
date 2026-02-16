'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Job {
  id: string
  category: string
  description: string
  status: string
  location: {
    street: string
    city: string
    state: string
    zipCode: string
    latitude: number
    longitude: number
  }
  createdAt: string
  distance?: number
}

export default function FindJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [claimingJob, setClaimingJob] = useState<string | null>(null)
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('recent')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchJobs(token)
  }, [])

  useEffect(() => {
    applyFilters()
  }, [jobs, categoryFilter, sortBy, searchQuery])

  const fetchJobs = async (token: string) => {
    try {
      const response = await fetch('/api/jobs/available', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }

      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error('Fetch jobs error:', error)
      alert('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...jobs]

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(job => job.category === categoryFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(job =>
        job.description.toLowerCase().includes(query) ||
        job.category.toLowerCase().includes(query) ||
        job.location.city.toLowerCase().includes(query) ||
        job.location.zipCode.includes(query)
      )
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'distance':
        // For now, sort by zip code (will add real distance calculation later)
        filtered.sort((a, b) => a.location.zipCode.localeCompare(b.location.zipCode))
        break
    }

    setFilteredJobs(filtered)
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

      alert('Job claimed successfully! Check your dashboard.')
      // Remove claimed job from list
      setJobs(jobs.filter(j => j.id !== jobId))
    } catch (error: any) {
      alert(`Failed to claim job: ${error.message}`)
    } finally {
      setClaimingJob(null)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hvac': return '❄️'
      case 'plumbing': return '🔧'
      case 'electrical': return '⚡'
      case 'general_maintenance': return '🛠️'
      default: return '📋'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'hvac': return 'HVAC'
      case 'plumbing': return 'Plumbing'
      case 'electrical': return 'Electrical'
      case 'general_maintenance': return 'General Maintenance'
      default: return category
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
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
            <div className="flex items-center gap-8">
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
                  href="/provider/jobs/find"
                  className="px-4 py-2 text-blue-600 font-medium border-b-2 border-blue-600"
                >
                  Find Jobs
                </Link>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <Link
                href="/provider/settings"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('accessToken')
                  localStorage.removeItem('refreshToken')
                  router.push('/')
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Jobs</h1>
          <p className="text-gray-600 mt-2">Discover and claim jobs in your area</p>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="hvac">HVAC</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="general_maintenance">General Maintenance</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="distance">Distance</option>
              </select>
            </div>

            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by keywords, location, zip code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredJobs.length}</span> job{filteredJobs.length !== 1 ? 's' : ''}
              {categoryFilter !== 'all' && ` in ${getCategoryLabel(categoryFilter)}`}
            </p>
          </div>
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'No available jobs at the moment. Check back soon!'}
            </p>
            {(searchQuery || categoryFilter !== 'all') && (
              <button
                onClick={() => {
                  setCategoryFilter('all')
                  setSearchQuery('')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Job Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getCategoryIcon(job.category)}</span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getCategoryLabel(job.category)}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-medium">
                          Available
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📍 {job.location.city}, {job.location.state} {job.location.zipCode}</span>
                        <span>🕒 Posted {getTimeAgo(job.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Job Description */}
                  <p className="text-gray-700 mb-4 line-clamp-2">
                    {job.description}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Link
                      href={`/provider/jobs/available/${job.id}`}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleClaimJob(job.id)}
                      disabled={claimingJob === job.id}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {claimingJob === job.id ? 'Claiming...' : 'Claim Job'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
