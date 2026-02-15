'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProviderProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [completedJobs, setCompletedJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchProfileData(token)
  }, [router])

  const fetchProfileData = async (token: string) => {
    try {
      // Fetch user profile
      const profileResponse = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (profileResponse.ok) {
        const data = await profileResponse.json()
        setProfile(data.user?.serviceProviderProfile || {})
      }

      // Fetch completed jobs
      const jobsResponse = await fetch('/api/jobs?status=completed', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json()
        setCompletedJobs(jobsData.jobs || [])
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error)
      setProfile({})
      setCompletedJobs([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to load profile</p>
          <Link href="/provider/dashboard" className="text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const averageRating = completedJobs.length > 0
    ? completedJobs.reduce((sum, job) => sum + (job.rating || 0), 0) / completedJobs.filter(j => j.rating).length
    : 0

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
            <div className="flex gap-4">
              <Link
                href="/provider/settings"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Settings
              </Link>
              <Link
                href="/provider/dashboard"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile?.businessName || 'Your Business'}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span>📞 {profile?.phoneNumber || 'No phone number'}</span>
                {profile?.licenseNumber && (
                  <span>🔖 License: {profile.licenseNumber}</span>
                )}
              </div>
            </div>
            <Link
              href="/provider/settings"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Profile
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{completedJobs.length}</div>
              <div className="text-sm text-gray-600">Completed Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500">
                {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">${profile?.diagnosticFee || 0}</div>
              <div className="text-sm text-gray-600">Consultation Fee</div>
            </div>
          </div>

          {/* Specialties */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {profile?.specialties && profile.specialties.length > 0 ? (
                profile.specialties.map((specialty: string) => (
                  <span
                    key={specialty}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize"
                  >
                    {specialty.replace('_', ' ')}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm">No specialties set</span>
              )}
            </div>
          </div>
        </div>

        {/* Completed Jobs & Reviews */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Completed Jobs & Reviews</h2>

          {completedJobs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No completed jobs yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Complete your first job to start building your reputation!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {completedJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 capitalize">
                        {job.category.replace('_', ' ')} Service
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(job.completedAt || job.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    {job.rating && (
                      <div className="flex items-center gap-2">
                        <div className="flex text-yellow-400 text-xl">
                          {'★'.repeat(Math.floor(job.rating))}
                          {'☆'.repeat(5 - Math.floor(job.rating))}
                        </div>
                        <span className="text-gray-600 font-medium">{job.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-700 mb-4">{job.description}</p>

                  {job.review && (
                    <div className="bg-gray-50 rounded-lg p-4 mt-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">Customer Review:</p>
                      <p className="text-gray-700 italic">"{job.review}"</p>
                    </div>
                  )}

                  {job.finalAmount && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="text-sm text-gray-600">Job Value: </span>
                      <span className="font-semibold text-gray-900">${job.finalAmount}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
