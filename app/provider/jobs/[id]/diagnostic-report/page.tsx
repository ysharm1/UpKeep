'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function SubmitDiagnosticReportPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [job, setJob] = useState<any>(null)
  
  const [report, setReport] = useState({
    summary: '',
    recommendation: 'REPAIR' as 'REPAIR' | 'REPLACE' | 'MONITOR' | 'NO_ACTION_NEEDED',
    severity: 'MEDIUM' as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | '',
    estimatedCost: '',
    photoUrls: [] as string[],
  })

  const [photoInput, setPhotoInput] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchJob(token)
  }, [jobId])

  const fetchJob = async (token: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setJob(data.jobRequest)
      }
    } catch (error) {
      console.error('Error fetching job:', error)
    }
  }

  const addPhoto = () => {
    if (photoInput.trim()) {
      setReport({
        ...report,
        photoUrls: [...report.photoUrls, photoInput.trim()],
      })
      setPhotoInput('')
    }
  }

  const removePhoto = (index: number) => {
    setReport({
      ...report,
      photoUrls: report.photoUrls.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (report.summary.length < 20) {
      alert('Please provide a detailed diagnosis (at least 20 characters)')
      return
    }

    if (report.photoUrls.length === 0) {
      alert('Please add at least one photo')
      return
    }

    setLoading(true)
    
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/jobs/${jobId}/diagnostic-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit report')
      }

      alert('Professional assessment submitted successfully!')
      router.push('/provider/dashboard')
    } catch (error: any) {
      alert(`Failed to submit: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/provider/dashboard" className="text-2xl font-bold text-blue-600">
              UpKeep Pro
            </Link>
            <Link href="/provider/dashboard" className="px-4 py-2 text-gray-700 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Submit Professional Assessment</h1>
          <p className="text-gray-600 mt-1">Provide your expert diagnosis and recommendations</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Job Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Job Details</h2>
            
            <div className="space-y-3">
              <div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full uppercase">
                  {job.category}
                </span>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Problem Description</h3>
                <p className="text-gray-900">{job.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                <p className="text-gray-900">
                  {job.location?.street}<br />
                  {job.location?.city}, {job.location?.state} {job.location?.zipCode}
                </p>
              </div>
            </div>
          </div>

          {/* Diagnostic Report Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Professional Assessment</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnosis Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={report.summary}
                  onChange={(e) => setReport({ ...report, summary: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what you found, the root cause, and your professional assessment..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {report.summary.length}/20 characters minimum
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommendation <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={report.recommendation}
                  onChange={(e) => setReport({ ...report, recommendation: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="REPAIR">Repair Recommended</option>
                  <option value="REPLACE">Replace Recommended</option>
                  <option value="MONITOR">Monitor Situation</option>
                  <option value="NO_ACTION_NEEDED">No Action Needed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity Level
                </label>
                <select
                  value={report.severity}
                  onChange={(e) => setReport({ ...report, severity: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select severity...</option>
                  <option value="CRITICAL">🔴 Critical - Immediate attention</option>
                  <option value="HIGH">🟠 High - Address soon</option>
                  <option value="MEDIUM">🟡 Medium - Schedule repair</option>
                  <option value="LOW">🟢 Low - Minor issue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Cost Range
                </label>
                <input
                  type="text"
                  value={report.estimatedCost}
                  onChange={(e) => setReport({ ...report, estimatedCost: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., $200-$500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photos <span className="text-red-500">* (at least 1)</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={photoInput}
                    onChange={(e) => setPhotoInput(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Photo URL"
                  />
                  <button
                    type="button"
                    onClick={addPhoto}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Add
                  </button>
                </div>
                {report.photoUrls.length > 0 && (
                  <div className="space-y-2">
                    {report.photoUrls.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 text-gray-600 truncate">📷 {url}</span>
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Professional Assessment'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
