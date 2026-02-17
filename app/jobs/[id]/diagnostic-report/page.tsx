'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function ViewDiagnosticReportPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [report, setReport] = useState<any>(null)
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchDiagnosticReport(token)
  }, [jobId])

  const fetchDiagnosticReport = async (token: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/diagnostic-report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch diagnostic report')
      }

      const data = await response.json()
      setReport(data.diagnosticReport)
      setJob(data.jobRequest)
    } catch (error: any) {
      console.error('Fetch report error:', error)
      alert(error.message || 'Failed to load diagnostic report')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRecommendationLabel = (rec: string) => {
    switch (rec) {
      case 'REPAIR':
        return 'Repair Recommended'
      case 'REPLACE':
        return 'Replacement Recommended'
      case 'MONITOR':
        return 'Monitor Situation'
      case 'NO_ACTION_NEEDED':
        return 'No Action Needed'
      default:
        return rec
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Diagnostic Report</h1>
          <p className="text-gray-600 mb-8">
            Professional assessment from your service provider
          </p>

          {job && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="font-semibold text-gray-900 mb-2">Job Details</h2>
              <p className="text-sm text-gray-600 capitalize">{job.category} Service</p>
              <p className="text-sm text-gray-600 mt-1">{job.description}</p>
            </div>
          )}

          {report && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className={`px-4 py-2 rounded-lg font-medium ${getSeverityColor(report.severity)}`}>
                  {report.severity} Priority
                </div>
                <div className="px-4 py-2 rounded-lg font-medium bg-blue-100 text-blue-800">
                  {getRecommendationLabel(report.recommendation)}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{report.summary}</p>
              </div>

              {report.estimatedCost && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Estimated Cost</h3>
                  <p className="text-gray-700">{report.estimatedCost}</p>
                </div>
              )}

              <div className="pt-6 border-t">
                <p className="text-sm text-gray-500">
                  Report submitted on {new Date(report.createdAt).toLocaleDateString()} at{' '}
                  {new Date(report.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
