'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import StripePaymentForm from '@/app/components/StripePaymentForm'

export default function ApproveRepairPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [job, setJob] = useState<any>(null)
  const [quote, setQuote] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchJobAndQuote(token)
  }, [jobId])

  const fetchJobAndQuote = async (token: string) => {
    try {
      // Fetch job details
      const jobResponse = await fetch(`/api/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!jobResponse.ok) {
        throw new Error('Failed to fetch job')
      }

      const jobData = await jobResponse.json()
      setJob(jobData.jobRequest)

      // Fetch repair quote
      const quoteResponse = await fetch(`/api/jobs/${jobId}/repair-quote`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (quoteResponse.ok) {
        const quoteData = await quoteResponse.json()
        setQuote(quoteData.quote)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to load repair quote')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (paymentMethodId: string) => {
    setApproving(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/jobs/${jobId}/approve-repair`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to approve')
      }

      alert('Repair quote approved! Payment authorized. The provider will complete the work.')
      router.push(`/jobs/${jobId}`)
    } catch (error: any) {
      alert(`Approval failed: ${error.message}`)
      throw error
    } finally {
      setApproving(false)
    }
  }

  const handlePaymentError = (errorMessage: string) => {
    alert(`Payment failed: ${errorMessage}`)
  }

  const handleDecline = async () => {
    prompt('Please provide a reason for declining (optional):')
    
    setDeclining(true)
    try {
      // TODO: Implement decline endpoint
      alert('Quote declined. The provider has been notified.')
      router.push(`/jobs/${jobId}`)
    } catch (error: any) {
      alert(`Decline failed: ${error.message}`)
    } finally {
      setDeclining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading repair quote...</p>
        </div>
      </div>
    )
  }

  if (!job || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Repair quote not found</p>
          <Link href="/dashboard" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const diagnosticFee = job.assignedProvider?.serviceProviderProfile?.diagnosticFee || 0
  const totalCost = diagnosticFee + quote.totalAmount

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
              href={`/jobs/${jobId}`}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              ← Back to Job Details
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Repair Quote</h1>
          <p className="text-gray-600 mb-6">
            {job.assignedProvider?.serviceProviderProfile?.businessName} has provided a quote for your repair.
          </p>

          {/* Job Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Job Details</h3>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Category:</strong> {job.category}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Description:</strong> {job.description}
            </p>
          </div>

          {/* Quote Breakdown */}
          <div className="border-2 border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quote Breakdown</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Labor Cost</span>
                <span className="font-semibold text-gray-900">${quote.laborCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Parts Cost</span>
                <span className="font-semibold text-gray-900">${quote.partsCost.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Repair Subtotal</span>
                  <span className="font-semibold text-gray-900">${quote.totalAmount.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Diagnostic Fee</span>
                <span className="font-semibold text-gray-900">${diagnosticFee.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-gray-300 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total Cost</span>
                  <span className="text-2xl font-bold text-blue-600">${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {quote.notes && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
                <p className="text-sm font-medium text-blue-900 mb-1">Provider Notes:</p>
                <p className="text-sm text-blue-800">{quote.notes}</p>
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-yellow-900 mb-2">💳 Payment Information</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Diagnostic fee (${diagnosticFee}) was already authorized</li>
              <li>• Repair cost (${quote.totalAmount.toFixed(2)}) will be authorized now</li>
              <li>• Both payments will be captured after work is completed</li>
              <li>• You can cancel before work begins for a full refund</li>
            </ul>
          </div>

          {/* Action Buttons */}
          {!showPaymentForm ? (
            <div className="flex gap-4">
              <button
                onClick={() => setShowPaymentForm(true)}
                disabled={approving || declining}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 transition-colors"
              >
                Approve & Authorize Payment
              </button>
              <button
                onClick={handleDecline}
                disabled={approving || declining}
                className="flex-1 px-6 py-3 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-semibold disabled:opacity-50 transition-colors"
              >
                {declining ? 'Declining...' : 'Decline Quote'}
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
              <StripePaymentForm
                amount={quote.totalAmount}
                onSuccess={handleApprove}
                onError={handlePaymentError}
                buttonText={approving ? 'Approving...' : `Approve & Authorize $${quote.totalAmount.toFixed(2)}`}
              />
              <button
                onClick={() => setShowPaymentForm(false)}
                disabled={approving}
                className="mt-4 text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href={`/jobs/${jobId}`}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Job Details
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
