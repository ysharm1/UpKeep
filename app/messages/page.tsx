'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MessagesPage() {
  const router = useRouter()
  const [threads, setThreads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchThreads(token)
    fetchUserRole(token)
  }, [router])

  const fetchUserRole = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUserRole(data.user?.role || '')
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error)
    }
  }

  const fetchThreads = async (token: string) => {
    try {
      const response = await fetch('/api/messages/threads', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setThreads(data.threads || [])
      }
    } catch (error) {
      console.error('Failed to fetch threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const getOtherPartyName = (thread: any) => {
    if (userRole === 'homeowner') {
      return thread.jobRequest?.serviceProvider?.businessName || 'Service Provider'
    } else {
      const homeowner = thread.jobRequest?.homeowner
      return `${homeowner?.firstName || ''} ${homeowner?.lastName || ''}`.trim() || 'Homeowner'
    }
  }

  const getLastMessage = (thread: any) => {
    if (thread.messages && thread.messages.length > 0) {
      return thread.messages[0].content
    }
    return 'No messages yet'
  }

  const getLastMessageTime = (thread: any) => {
    const date = new Date(thread.lastMessageAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link
                href={userRole === 'service_provider' ? '/provider/dashboard' : '/dashboard'}
                className="text-2xl font-bold text-blue-600"
              >
                UpKeep {userRole === 'service_provider' && 'Pro'}
              </Link>
            </div>
            <Link
              href={userRole === 'service_provider' ? '/provider/dashboard' : '/dashboard'}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">Communicate with your {userRole === 'homeowner' ? 'service providers' : 'clients'}</p>
          </div>

          {threads.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-600 mt-4">No messages yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Messages will appear here when you start communicating with {userRole === 'homeowner' ? 'providers' : 'homeowners'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {threads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/messages/${thread.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {getOtherPartyName(thread)}
                        </h3>
                        {thread.unreadCount > 0 && (
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1 capitalize">
                        {thread.jobRequest?.category?.replace('_', ' ')} Service
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {getLastMessage(thread)}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {getLastMessageTime(thread)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
