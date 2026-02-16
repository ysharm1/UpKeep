'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function AvailableJobDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchJobDetails(token)
  }, [jobId])

  const fetchJobDetails = async (token: string) => {
    try {
      const response = await fetch(`/api/provider/jobs/available/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch job details')
      }

      const data = await response.json()
      setJob(data.jobRequest)
    } catch (error) {
      console.error('Job details error:', error)
      alert('Failed to load job details')
      router.push('/provider/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimJob = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    setClaiming(true)
    try {
      const response = await fetch(`/api/provider/jobs/${jobId}/claim`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to claim job')
      }

      alert('Job claimed successfully!')
      router.push('/provider/dashboard')
    } catch (error: any) {
      console.error('Claim job error:', error)
      alert(error.message || 'Failed to claim job')
    } finally {
      setClaiming(false)
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

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Job not found</p>
          <Link href="/provider/dashboard" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
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
                UpKeep
              </Link>
            </div>
            <Link
              href="/provider/dashboard"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.category}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className="px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800">
              Available
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Problem Description</h2>
              <p className="text-gray-700">{job.description}</p>
            </div>

            {job.location && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Location</h2>
                <p className="text-gray-700">
                  {job.location.city}, {job.location.state} {job.location.zipCode}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Full address will be visible after claiming the job
                </p>
              </div>
            )}

            {job.mediaFiles && job.mediaFiles.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Attachments</h2>
                <div className="grid grid-cols-3 gap-4">
                  {job.mediaFiles.map((file: any) => (
                    <div key={file.id} className="border rounded-lg p-2">
                      <p className="text-sm text-gray-600 truncate">{file.filename}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t">
            <div className="flex gap-4">
              <button
                onClick={handleClaimJob}
                disabled={claiming}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
              >
                {claiming ? 'Claiming...' : 'Claim This Job'}
              </button>
              <Link
                href="/provider/dashboard"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
