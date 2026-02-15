'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function ViewDiagnosticReportPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [job, setJob] = useState<any>(null)
  const [report, setReport] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchData(token)
  }, [jobId])

  const fetchData = async (token: string) => {
    try {
      // Fetch job
      const jobResponse = await fetch(`/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (jobResponse.ok) {
        const jobData = await jobResponse.json()
        setJob(jobData.jobRequest)
      }

      // Fetch diagnostic report
      const reportResponse = await fetch(`/api/jobs/${jobId}/diagnostic-report`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (reportResponse.ok) {
        const reportData = await reportResponse.json()
        setReport(reportData.report)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'REPAIR': return '🔧 Repair Recommended'
      case 'REPLACE': return '🔄 Replace Recommended'
      case 'MONITOR': return '👁️ Monitor Situation'
      case 'NO_ACTION_NEEDED': return '✅ No Action Needed'
      default: return recommendation
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No diagnostic report available yet</p>
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
            <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
              UpKeep
            </Link>
            <Link href={`/jobs/${jobId}`} className="px-4 py-2 text-gray-700 hover:text-gray-900">
              ← Back to Job
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Professional Assessment Delivered</h1>
            <p className="text-gray-600 mt-1">Expert diagnosis from {job?.assignedProvider?.serviceProviderProfile?.businessName}</p>
          </div>

          {/* Recommendation & Severity */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Recommendation</h3>
              <p className="text-lg font-semibold text-blue-900">
                {getRecommendationText(report.recommendation)}
              </p>
            </div>

            {report.severity && (
              <div className={`border-2 rounded-lg p-4 ${getSeverityColor(report.severity)}`}>
                <h3 className="text-sm font-medium mb-2">Severity Level</h3>
                <p className="text-lg font-semibold">{report.severity}</p>
              </div>
            )}
          </div>

          {/* Diagnosis Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Diagnosis Summary</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-800 whitespace-pre-wrap">{report.summary}</p>
            </div>
          </div>

          {/* Estimated Cost */}
          {report.estimatedCost && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Estimated Cost Range</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xl font-bold text-green-900">{report.estimatedCost}</p>
                <p className="text-sm text-green-700 mt-1">Final quote will be provided after approval</p>
              </div>
            </div>
          )}

          {/* Photos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Documentation Photos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {report.photoUrls.map((url: string, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src={url} 
                    alt={`Diagnostic photo ${index + 1}`}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Photo'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Value Statement */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>✓ Professional Assessment Complete</strong><br />
              You now have expert documentation of your issue, including diagnosis, photos, and recommendations. 
              This assessment is yours to keep regardless of whether you proceed with the repair.
            </p>
          </div>

          {/* Next Steps */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Next Steps</h3>
            <div className="space-y-3">
              {report.recommendation === 'REPAIR' || report.recommendation === 'REPLACE' ? (
                <>
                  <p className="text-gray-700">
                    The provider will submit a detailed repair quote based on this assessment.
                    You'll be notified when it's ready for your review.
                  </p>
                  <Link
                    href={`/jobs/${jobId}`}
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    View Job Status
                  </Link>
                </>
              ) : report.recommendation === 'MONITOR' ? (
                <p className="text-gray-700">
                  The provider recommends monitoring the situation. No immediate action is required.
                  Keep an eye on the issue and contact them if it worsens.
                </p>
              ) : (
                <p className="text-gray-700">
                  Good news! No action is needed at this time. The diagnostic fee covers this professional assessment.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
