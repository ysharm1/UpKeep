'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function SubmitRepairQuotePage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [quote, setQuote] = useState({
    laborCost: '',
    partsCost: '',
    notes: '',
  })

  // Mock job data
  const job = {
    id: jobId,
    category: 'hvac',
    description: 'AC not cooling properly, making loud noise when running. Started yesterday. The unit is about 5 years old and has been maintained regularly.',
    location: { street: '123 Main St', city: 'San Francisco', state: 'CA', zipCode: '94102' },
    homeowner: { firstName: 'John', lastName: 'Smith', phone: '(415) 555-0123' },
    diagnosticFee: 89,
    diagnosticStatus: 'completed',
  }

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }
  }, [])

  const calculateTotal = () => {
    const labor = parseFloat(quote.laborCost) || 0
    const parts = parseFloat(quote.partsCost) || 0
    return (labor + parts).toFixed(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!quote.laborCost || !quote.partsCost) {
      alert('Please fill in labor and parts costs')
      return
    }

    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 1500)
  }

  if (submitted) {
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
            </div>
          </div>
        </nav>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Repair Quote Sent!</h2>
            <p className="text-gray-600 mb-6">
              The homeowner has been notified and will approve or decline your quote.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
              <p className="text-sm text-blue-800">
                💡 You&apos;ll be notified when they respond. If approved, you can proceed with the repair.
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Link
                href="/provider/dashboard"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </main>
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Submit Repair Quote</h1>
          <p className="text-gray-600 mt-1">You&apos;ve completed the diagnostic. Now provide a quote for the repair.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Job Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Job Details</h2>
            
            <div className="space-y-4">
              <div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full uppercase">
                  {job.category}
                </span>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                <p className="text-gray-900">{job.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                <p className="text-gray-900">
                  {job.location.street}<br />
                  {job.location.city}, {job.location.state} {job.location.zipCode}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Homeowner</h3>
                <p className="text-gray-900">{job.homeowner.firstName} {job.homeowner.lastName}</p>
                <p className="text-sm text-gray-600">{job.homeowner.phone}</p>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Diagnostic Fee</span>
                  <span className="text-lg font-bold text-green-600">${job.diagnosticFee}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Already authorized</p>
              </div>
            </div>
          </div>

          {/* Repair Quote Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Repair Quote</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Labor Cost <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={quote.laborCost}
                    onChange={(e) => setQuote({ ...quote, laborCost: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="200.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Time and labor for the repair</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parts Cost <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={quote.partsCost}
                    onChange={(e) => setQuote({ ...quote, partsCost: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="150.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Cost of parts and materials</p>
              </div>

              <div className="border-t pt-4">
                <div className="bg-gray-50 rounded p-3 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Diagnostic Fee</span>
                    <span className="font-medium text-gray-900">${job.diagnosticFee}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Repair Cost</span>
                    <span className="font-medium text-gray-900">${calculateTotal()}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${(parseFloat(calculateTotal()) + job.diagnosticFee).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={quote.notes}
                  onChange={(e) => setQuote({ ...quote, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Explain what needs to be fixed and any warranty details..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Repair Quote'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
