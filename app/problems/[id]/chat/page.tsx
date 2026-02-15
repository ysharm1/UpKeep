'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function ProblemChatPage() {
  const router = useRouter()
  const params = useParams()
  const problemId = params.id as string

  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [followUpQuestion, setFollowUpQuestion] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchJobDetails(token)
  }, [problemId])

  const fetchJobDetails = async (token: string) => {
    try {
      const response = await fetch(`/api/jobs/${problemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch job details')
      }

      const data = await response.json()
      setJob(data.jobRequest)
      
      // Initialize chat with the problem description
      setChatMessages([
        { role: 'user', content: data.jobRequest.description },
        { role: 'assistant', content: `I understand you're having issues with ${data.jobRequest.category}. Let me help you troubleshoot this. What specific questions do you have?` }
      ])
    } catch (error) {
      console.error('Job details error:', error)
      alert('Failed to load problem details')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!followUpQuestion.trim() || sendingMessage || !job) return

    setSendingMessage(true)
    const userMessage = followUpQuestion
    setFollowUpQuestion('')

    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const token = localStorage.getItem('accessToken')
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: job.category,
          description: job.description,
          chatHistory: chatMessages,
          question: userMessage,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Sorry, I had trouble processing that. Could you rephrase your question?' 
        }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }])
    } finally {
      setSendingMessage(false)
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

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Problem not found</p>
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
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                UpKeep
              </Link>
            </div>
            <Link
              href={`/jobs/${problemId}`}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              ← Back to Problem Details
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">AI Assistant Chat</h1>
            <p className="text-sm text-gray-600 mt-1">
              Problem: {job.category} - {job.description.substring(0, 100)}...
            </p>
          </div>

          {/* Chat Messages */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 h-96 overflow-y-auto space-y-3">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {sendingMessage && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={followUpQuestion}
              onChange={(e) => setFollowUpQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask a question about your problem..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sendingMessage}
            />
            <button
              onClick={handleSendMessage}
              disabled={!followUpQuestion.trim() || sendingMessage}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              Send
            </button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600 mb-4">
              💡 Try asking: "What tools do I need?", "Is this safe?", "What if it doesn't work?"
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                ✓ Problem Solved
              </button>
              <Link
                href={`/problems/${problemId}/professionals`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-block"
              >
                → Find Professional
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
