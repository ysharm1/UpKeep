'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

// Progress bar component
function JobProgressBar({ status }: { status: string }) {
  const steps = [
    { key: 'submitted', label: 'Submitted', icon: '📝' },
    { key: 'diagnostic_scheduled', label: 'Provider Assigned', icon: '👷' },
    { key: 'diagnostic_completed', label: 'Assessment', icon: '🔍' },
    { key: 'repair_pending_approval', label: 'Quote', icon: '💰' },
    { key: 'completed', label: 'Complete', icon: '✅' },
  ]

  const statusOrder = [
    'submitted',
    'pending_match',
    'matched',
    'diagnostic_scheduled',
    'diagnostic_completed',
    'repair_pending_approval',
    'repair_approved',
    'in_progress',
    'completed',
  ]

  const currentIndex = statusOrder.indexOf(status)

  const getStepStatus = (stepKey: string) => {
    const stepIndex = statusOrder.indexOf(stepKey)
    if (stepIndex <= currentIndex) return 'complete'
    if (stepIndex === currentIndex + 1) return 'current'
    return 'upcoming'
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.key)
          return (
            <div key={step.key} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    stepStatus === 'complete'
                      ? 'bg-green-500 text-white'
                      : stepStatus === 'current'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {stepStatus === 'complete' ? '✓' : step.icon}
                </div>
                <span
                  className={`text-xs mt-2 text-center ${
                    stepStatus === 'complete' || stepStatus === 'current'
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    getStepStatus(steps[index + 1].key) === 'complete'
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function JobDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

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
      console.log('Fetching job details for ID:', jobId)
      const response = await fetch(`/api/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || 'Failed to fetch job details')
      }

      const data = await response.json()
      console.log('Job data received:', data)
      setJob(data.jobRequest)
    } catch (error) {
      console.error('Job details error:', error)
      alert(`Failed to load job details: ${error instanceof Error ? error.message : 'Unknown error'}`)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = async () => {
    if (!confirm('Are you sure you want to mark this job as complete?')) {
      return
    }

    setCompleting(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/jobs/${jobId}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to mark job as complete')
      }

      alert('Job marked as complete!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Complete job error:', error)
      alert('Failed to mark job as complete')
    } finally {
      setCompleting(false)
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
          <Link href="/dashboard" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
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
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                UpKeep
              </Link>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Progress Bar */}
          <JobProgressBar status={job.status} />

          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.category}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Created {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
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
              {job.status.replace(/_/g, ' ')}
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
                  {job.location.street}<br />
                  {job.location.city}, {job.location.state} {job.location.zipCode}
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

            {job.serviceProvider && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Service Provider</h2>
                <div className="border rounded-lg p-4">
                  <p className="font-medium text-gray-900">
                    {job.serviceProvider.businessName}
                  </p>
                  <p className="text-sm text-gray-600">{job.serviceProvider.phoneNumber}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t">
            <div className="flex gap-4 flex-wrap">
              {/* View Diagnostic Report */}
              {['diagnostic_completed', 'repair_pending_approval', 'repair_approved', 'in_progress', 'completed'].includes(job.status) && (
                <Link
                  href={`/jobs/${jobId}/diagnostic-report`}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  View Professional Assessment
                </Link>
              )}

              {/* Approve Repair Quote */}
              {job.status === 'repair_pending_approval' && (
                <Link
                  href={`/jobs/${jobId}/approve-repair`}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Review Repair Quote
                </Link>
              )}

              {/* Mark as Complete */}
              {['diagnostic_scheduled', 'diagnostic_completed', 'repair_approved', 'in_progress'].includes(job.status) && (
                <button
                  onClick={handleMarkComplete}
                  disabled={completing}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {completing ? 'Marking Complete...' : 'Mark as Complete'}
                </button>
              )}

              {/* Find Professionals */}
              {['submitted', 'pending_match'].includes(job.status) && (
                <Link
                  href={`/problems/${jobId}/professionals`}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Find Professionals
                </Link>
              )}

              {/* Continue AI Chat */}
              {['submitted', 'ai_diagnosis'].includes(job.status) && (
                <Link
                  href={`/problems/${jobId}/chat`}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  Continue AI Diagnosis
                </Link>
              )}

              <Link
                href="/dashboard"
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
