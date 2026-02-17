'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function ApproveRepairPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [quote, setQuote] = useState<any>(null)
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchRepairQuote(token)
  }, [jobId])

  const fetchRepairQuote = async (token: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/repair-quote`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch repair quote')
      }

      const data = await response.json()
      setQuote(data.repairQuote)
      setJob(data.jobRequest)
    } catch (error: any) {
      console.error('Fetch quote error:', error)
      alert(error.message || 'Failed to load repair quote')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (approved: boolean) => {
    if (!approved) {
      if (!confirm('Are you sure you want to decline this quote?')) {
        return
      }
    }

    setProcessing(true)
    try {
      const token = localStorage.getItem('accessToken')

      const response = await fetch(`/api/jobs/${jobId}/approve-repair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approved }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process approval')
      }

      alert(approved ? 'Quote approved! Provider will begin work.' : 'Quote declined.')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Approval error:', error)
      alert(error.message || 'Failed to process approval')
    } finally {
      setProcessing(false)
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Repair Quote</h1>
          <p className="text-gray-600 mb-8">
            Review and approve or decline the repair quote from your provider
          </p>

          {job && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="font-semibold text-gray-900 mb-2">Job Details</h2>
              <p className="text-sm text-gray-600 capitalize">{job.category} Service</p>
              <p className="text-sm text-gray-600 mt-1">{job.description}</p>
            </div>
          )}

          {quote && (
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Labor Cost</span>
                    <span className="font-medium text-gray-900">
                      ${parseFloat(quote.laborCost).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parts Cost</span>
                    <span className="font-medium text-gray-900">
                      ${parseFloat(quote.partsCost).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ${parseFloat(quote.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {quote.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Notes</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
                </div>
              )}

              {quote.provider && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Quote provided by <span className="font-medium">{quote.provider.businessName}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted on {new Date(quote.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="pt-6 border-t">
                <div className="flex gap-4">
                  <button
                    onClick={() => handleApproval(true)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400"
                  >
                    {processing ? 'Processing...' : 'Approve Quote'}
                  </button>
                  <button
                    onClick={() => handleApproval(false)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:bg-gray-400"
                  >
                    {processing ? 'Processing...' : 'Decline Quote'}
                  </button>
                </div>
                <Link
                  href="/dashboard"
                  className="mt-4 block text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
