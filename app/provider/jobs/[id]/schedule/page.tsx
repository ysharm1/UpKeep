'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function ScheduleDiagnosticPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [scheduling, setScheduling] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

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
      const response = await fetch(`/api/provider/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch job')
      }

      const data = await response.json()
      setJob(data.jobRequest)
    } catch (error: any) {
      console.error('Fetch job error:', error)
      alert(error.message || 'Failed to load job')
      router.push('/provider/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!scheduledDate || !scheduledTime) {
      alert('Please select both date and time')
      return
    }

    setScheduling(true)
    try {
      const token = localStorage.getItem('accessToken')
      const dateTime = `${scheduledDate}T${scheduledTime}:00`

      const response = await fetch(`/api/jobs/${jobId}/schedule-diagnostic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scheduledDate: dateTime,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to schedule')
      }

      alert('Diagnostic scheduled successfully!')
      router.push('/provider/dashboard')
    } catch (error: any) {
      console.error('Schedule error:', error)
      alert(error.message || 'Failed to schedule diagnostic')
    } finally {
      setScheduling(false)
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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Diagnostic Visit</h1>
          <p className="text-gray-600 mb-8">
            Choose a date and time for the diagnostic visit
          </p>

          {job && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h2 className="font-semibold text-gray-900 mb-2">Job Details</h2>
              <p className="text-sm text-gray-600 capitalize">{job.category} Service</p>
              <p className="text-sm text-gray-600 mt-1">{job.description}</p>
              {job.location && (
                <p className="text-sm text-gray-600 mt-2">
                  Location: {job.location.city}, {job.location.state}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSchedule} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={scheduling}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
              >
                {scheduling ? 'Scheduling...' : 'Schedule Diagnostic'}
              </button>
              <Link
                href="/provider/dashboard"
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
