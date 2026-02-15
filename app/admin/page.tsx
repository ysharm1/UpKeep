'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Job {
  id: string
  status: string
  category: string
  homeowner: {
    firstName: string
    lastName: string
    phoneNumber: string
    user: { email: string }
  }
  serviceProvider?: {
    businessName: string
    phoneNumber: string
    user: { email: string }
  }
  assignedProviderId?: string
  diagnosticPaymentIntentId?: string
  repairPaymentIntentId?: string
  createdAt: string
}

interface ConfirmDialog {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  confirmText?: string
  confirmColor?: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })
  const [statusChangeJob, setStatusChangeJob] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchJobs()
  }, [filter])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChangeStatus = async (jobId: string, newStatus: string) => {
    setActionLoading(jobId)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, reason: 'Admin manual change' }),
      })

      if (response.ok) {
        alert('Status updated successfully')
        fetchJobs()
      } else {
        const data = await response.json()
        alert(`Failed: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to update status')
    } finally {
      setActionLoading(null)
      setStatusChangeJob(null)
    }
  }

  const handleCapturePayment = (jobId: string, paymentType: 'diagnostic' | 'repair') => {
    setConfirmDialog({
      isOpen: true,
      title: 'Capture Payment',
      message: `Are you sure you want to capture the ${paymentType} payment for this job?`,
      confirmText: 'Capture',
      confirmColor: 'green',
      onConfirm: async () => {
        setActionLoading(jobId)
        try {
          const token = localStorage.getItem('accessToken')
          const response = await fetch(`/api/admin/jobs/${jobId}/capture`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentType, reason: 'Admin manual capture' }),
          })

          if (response.ok) {
            const data = await response.json()
            alert(`Payment captured: $${data.amount}`)
            fetchJobs()
          } else {
            const data = await response.json()
            alert(`Failed: ${data.error}`)
          }
        } catch (error) {
          alert('Failed to capture payment')
        } finally {
          setActionLoading(null)
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        }
      },
    })
  }

  const handleRefund = (jobId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Issue Refund',
      message: 'Are you sure you want to refund this job? This will refund both diagnostic and repair payments.',
      confirmText: 'Refund',
      confirmColor: 'red',
      onConfirm: async () => {
        const reason = prompt('Enter refund reason:')
        if (!reason) return

        setActionLoading(jobId)
        try {
          const token = localStorage.getItem('accessToken')
          const response = await fetch(`/api/admin/jobs/${jobId}/refund`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentType: 'both', reason }),
          })

          if (response.ok) {
            alert('Refund processed successfully')
            fetchJobs()
          } else {
            const data = await response.json()
            alert(`Failed: ${data.error}`)
          }
        } catch (error) {
          alert('Failed to process refund')
        } finally {
          setActionLoading(null)
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        }
      },
    })
  }

  const handleForceComplete = (jobId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Force Complete Job',
      message: 'This will mark the job as completed and attempt to capture any pending payments. Continue?',
      confirmText: 'Complete',
      confirmColor: 'green',
      onConfirm: async () => {
        setActionLoading(jobId)
        try {
          const token = localStorage.getItem('accessToken')
          const response = await fetch(`/api/admin/jobs/${jobId}/force-complete`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reason: 'Admin force complete' }),
          })

          if (response.ok) {
            alert('Job completed successfully')
            fetchJobs()
          } else {
            const data = await response.json()
            alert(`Failed: ${data.error}`)
          }
        } catch (error) {
          alert('Failed to complete job')
        } finally {
          setActionLoading(null)
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        }
      },
    })
  }

  const getFilteredJobs = () => {
    const now = new Date()
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)

    switch (filter) {
      case 'new_bookings':
        return jobs.filter(j => j.status === 'diagnostic_scheduled' && !j.serviceProvider)
      case 'pending_responses':
        return jobs.filter(j => 
          j.status === 'diagnostic_scheduled' && 
          new Date(j.createdAt) < fourHoursAgo
        )
      case 'pending_quotes':
        return jobs.filter(j => j.status === 'repair_pending_approval')
      case 'completed':
        return jobs.filter(j => j.status === 'completed')
      default:
        return jobs
    }
  }

  const filteredJobs = getFilteredJobs()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-red-600">⚙️ Admin Dashboard</span>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Operations Dashboard */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Daily Operations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => setFilter('new_bookings')}
              className={`p-4 rounded-lg border-2 ${filter === 'new_bookings' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
            >
              <div className="text-2xl font-bold text-blue-600">
                {jobs.filter(j => j.status === 'diagnostic_scheduled' && !j.serviceProvider).length}
              </div>
              <div className="text-sm text-gray-600">New Bookings</div>
            </button>

            <button
              onClick={() => setFilter('pending_responses')}
              className={`p-4 rounded-lg border-2 ${filter === 'pending_responses' ? 'border-yellow-600 bg-yellow-50' : 'border-gray-200'}`}
            >
              <div className="text-2xl font-bold text-yellow-600">
                {jobs.filter(j => {
                  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)
                  return j.status === 'diagnostic_scheduled' && new Date(j.createdAt) < fourHoursAgo
                }).length}
              </div>
              <div className="text-sm text-gray-600">Pending &gt;4hrs</div>
            </button>

            <button
              onClick={() => setFilter('pending_quotes')}
              className={`p-4 rounded-lg border-2 ${filter === 'pending_quotes' ? 'border-purple-600 bg-purple-50' : 'border-gray-200'}`}
            >
              <div className="text-2xl font-bold text-purple-600">
                {jobs.filter(j => j.status === 'repair_pending_approval').length}
              </div>
              <div className="text-sm text-gray-600">Pending Quotes</div>
            </button>

            <button
              onClick={() => setFilter('completed')}
              className={`p-4 rounded-lg border-2 ${filter === 'completed' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}
            >
              <div className="text-2xl font-bold text-green-600">
                {jobs.filter(j => j.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </button>
          </div>

          <button
            onClick={() => setFilter('all')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All Jobs ({jobs.length})
          </button>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {filter === 'all' ? 'All Jobs' : filter.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No jobs found</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredJobs.map(job => (
                <div key={job.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {job.homeowner.firstName} {job.homeowner.lastName}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          job.status === 'completed' ? 'bg-green-100 text-green-800' :
                          job.status === 'diagnostic_scheduled' ? 'bg-blue-100 text-blue-800' :
                          job.status === 'repair_pending_approval' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {job.category} • {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-gray-600">Job ID: {job.id.slice(0, 8)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <div className="font-medium text-gray-700">Homeowner</div>
                      <div className="text-gray-600">{job.homeowner.phoneNumber}</div>
                      <div className="text-gray-600">{job.homeowner.user.email}</div>
                    </div>
                    {job.serviceProvider && (
                      <div>
                        <div className="font-medium text-gray-700">Provider</div>
                        <div className="text-gray-600">{job.serviceProvider.businessName}</div>
                        <div className="text-gray-600">{job.serviceProvider.phoneNumber}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Details
                    </Link>
                    
                    {statusChangeJob === job.id ? (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleChangeStatus(job.id, e.target.value)
                          }
                        }}
                        className="px-3 py-1 text-sm border border-gray-300 rounded"
                        disabled={actionLoading === job.id}
                      >
                        <option value="">Select status...</option>
                        <option value="pending">Pending</option>
                        <option value="diagnostic_scheduled">Diagnostic Scheduled</option>
                        <option value="diagnostic_completed">Diagnostic Completed</option>
                        <option value="repair_pending_approval">Repair Pending Approval</option>
                        <option value="repair_approved">Repair Approved</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <button 
                        onClick={() => setStatusChangeJob(job.id)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        disabled={actionLoading === job.id}
                      >
                        Change Status
                      </button>
                    )}

                    {job.diagnosticPaymentIntentId && (
                      <button 
                        onClick={() => handleCapturePayment(job.id, 'diagnostic')}
                        className="px-3 py-1 text-sm border border-green-600 text-green-600 rounded hover:bg-green-50"
                        disabled={actionLoading === job.id}
                      >
                        Capture Diagnostic
                      </button>
                    )}

                    {job.repairPaymentIntentId && (
                      <button 
                        onClick={() => handleCapturePayment(job.id, 'repair')}
                        className="px-3 py-1 text-sm border border-green-600 text-green-600 rounded hover:bg-green-50"
                        disabled={actionLoading === job.id}
                      >
                        Capture Repair
                      </button>
                    )}

                    <button 
                      onClick={() => handleForceComplete(job.id)}
                      className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                      disabled={actionLoading === job.id}
                    >
                      Force Complete
                    </button>

                    <button 
                      onClick={() => handleRefund(job.id)}
                      className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50"
                      disabled={actionLoading === job.id}
                    >
                      Issue Refund
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 text-white rounded ${
                  confirmDialog.confirmColor === 'red' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {confirmDialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
