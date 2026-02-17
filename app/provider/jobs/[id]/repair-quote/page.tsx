'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function SubmitRepairQuotePage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [laborCost, setLaborCost] = useState('')
  const [partsCost, setPartsCost] = useState('')
  const [notes, setNotes] = useState('')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const labor = parseFloat(laborCost)
    const parts = parseFloat(partsCost)

    if (isNaN(labor) || isNaN(parts) || labor < 0 || parts < 0) {
      alert('Please enter valid costs')
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')

      const response = await fetch(`/api/jobs/${jobId}/repair-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          laborCost: labor,
          partsCost: parts,
          notes: notes || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit quote')
      }

      alert('Repair quote submitted successfully!')
      router.push('/provider/dashboard')
    } catch (error: any) {
      console.error('Submit error:', error)
      alert(error.message || 'Failed to submit repair quote')
    } finally {
      setSubmitting(false)
    }
  }

  const totalCost = (parseFloat(laborCost) || 0) + (parseFloat(partsCost) || 0)

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Repair Quote</h1>
          <p className="text-gray-600 mb-8">
            Provide a detailed quote for the repair work
          </p>

          {job && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h2 className="font-semibold text-gray-900 mb-2">Job Details</h2>
              <p className="text-sm text-gray-600 capitalize">{job.category} Service</p>
              <p className="text-sm text-gray-600 mt-1">{job.description}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Labor Cost *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parts Cost *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={partsCost}
                  onChange={(e) => setPartsCost(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Total Cost</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Include details about parts, timeline, warranty, etc..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
              >
                {submitting ? 'Submitting...' : 'Submit Quote'}
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
