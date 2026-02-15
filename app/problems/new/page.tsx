'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PhotoUpload from '@/app/components/PhotoUpload'

export default function NewProblemPage() {
  const router = useRouter()
  const [step, setStep] = useState<'describe' | 'ai-diagnosis' | 'resolved' | 'hire'>('describe')
  const [problem, setProblem] = useState({
    category: 'hvac',
    description: '',
    location: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    mediaUrls: [] as string[],
  })
  const [aiResponse, setAiResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [followUpQuestion, setFollowUpQuestion] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  // Fetch user profile and auto-populate address
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          router.push('/auth/login')
          return
        }

        const response = await fetch('/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          // Auto-populate address if user has one saved
          if (data.profile?.address) {
            setProblem(prev => ({
              ...prev,
              location: {
                street: data.profile.address.street || '',
                city: data.profile.address.city || '',
                state: data.profile.address.state || '',
                zipCode: data.profile.address.zipCode || '',
              },
            }))
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('accessToken')
      
      // Create job request with default coordinates (will be geocoded server-side in production)
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: problem.category,
          description: problem.description,
          mediaUrls: problem.mediaUrls,
          location: {
            ...problem.location,
            latitude: 37.7749, // Default to SF coordinates for demo
            longitude: -122.4194,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create problem')
      }

      const data = await response.json()
      const job = data.jobRequest

      // Get AI diagnosis
      const aiRes = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobId: job.id,
          description: problem.description,
          category: problem.category,
        }),
      })

      if (aiRes.ok) {
        const diagnosis = await aiRes.json()
        setAiResponse(diagnosis)
        
        // Initialize chat with the initial diagnosis
        setChatMessages([
          { role: 'user', content: problem.description },
          { role: 'assistant', content: diagnosis.diagnosis || 'Here are some solutions to try...' }
        ])
        
        setStep('ai-diagnosis')
      } else {
        // If AI fails, still allow user to proceed
        setAiResponse({
          diySteps: [
            {
              title: 'AI diagnosis temporarily unavailable',
              description: 'We can connect you with a professional to help with your ' + problem.category + ' issue.',
            },
          ],
          safetyWarnings: [],
        })
        setStep('ai-diagnosis')
      }
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Failed to submit problem. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleProblemResolved = () => {
    setStep('resolved')
  }

  const handleNeedProfessional = () => {
    setStep('hire')
  }

  const handleSkipToHire = async () => {
    if (problem.description.length < 10) {
      alert('Please describe your problem first')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      
      // Create job request with default coordinates
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: problem.category,
          description: problem.description,
          mediaUrls: problem.mediaUrls,
          location: {
            ...problem.location,
            latitude: 37.7749, // Default to SF coordinates for demo
            longitude: -122.4194,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create problem')
      }

      setStep('hire')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Failed to submit problem. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendFollowUp = async () => {
    if (!followUpQuestion.trim() || sendingMessage) return

    setSendingMessage(true)
    const userMessage = followUpQuestion
    setFollowUpQuestion('')

    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const token = localStorage.getItem('accessToken')
      
      // Send follow-up question to AI
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: problem.category,
          description: problem.description,
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
      console.error('Follow-up error:', error)
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }])
    } finally {
      setSendingMessage(false)
    }
  }

  if (step === 'resolved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Problem Solved!</h2>
          <p className="text-gray-600 mb-6">
            Great! We're glad the AI solution helped you fix the problem.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (step === 'hire') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Finding Local Professionals</h2>
            <p className="text-gray-600 mb-6">
              We're matching you with verified {problem.category} professionals in your area.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Your Problem:</strong> {problem.description.substring(0, 150)}...
              </p>
              <p className="text-sm text-blue-800 mt-2">
                <strong>Location:</strong> {problem.location.city}, {problem.location.state} {problem.location.zipCode}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-lg text-gray-900">Available Professionals:</h3>
              
              {/* Mock professional cards */}
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">Quick Fix Plumbing</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex text-yellow-400">
                        {'★'.repeat(5)}
                      </div>
                      <span className="text-sm text-gray-600">4.8 (42 reviews)</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Verified</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Specialties: {problem.category}
                    </p>
                    <p className="text-sm text-gray-600">
                      Distance: 2.3 miles away
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    Contact
                  </button>
                </div>
              </div>

              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">Cool Air HVAC</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex text-yellow-400">
                        {'★'.repeat(5)}
                      </div>
                      <span className="text-sm text-gray-600">4.9 (38 reviews)</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Verified</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Specialties: {problem.category}
                    </p>
                    <p className="text-sm text-gray-600">
                      Distance: 3.7 miles away
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    Contact
                  </button>
                </div>
              </div>

              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">Bright Spark Electric</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex text-yellow-400">
                        {'★'.repeat(4)}{'☆'}
                      </div>
                      <span className="text-sm text-gray-600">4.7 (29 reviews)</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Verified</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Specialties: {problem.category}
                    </p>
                    <p className="text-sm text-gray-600">
                      Distance: 5.1 miles away
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    Contact
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'ai-diagnosis') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Diagnosis & Solution</h2>
            
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
              <p className="text-sm text-blue-800">
                Our AI has analyzed your problem. Try these solutions first - they might save you time and money!
              </p>
            </div>

            {aiResponse?.diySteps && aiResponse.diySteps.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-lg text-gray-900">Recommended Steps:</h3>
                {aiResponse.diySteps.map((step: any, index: number) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{step.title}</h4>
                      <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                      {step.estimatedTime && (
                        <p className="text-xs text-gray-500 mt-1">⏱️ {step.estimatedTime}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {aiResponse?.safetyWarnings && aiResponse.safetyWarnings.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6">
                <h4 className="font-semibold text-red-900 mb-2">⚠️ Safety Warnings:</h4>
                <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                  {aiResponse.safetyWarnings.map((warning: string, index: number) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chat Interface */}
            <div className="border-t pt-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">💬 Have questions? Ask the AI!</h3>
              
              {/* Chat Messages */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto space-y-3">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
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
                  onKeyPress={(e) => e.key === 'Enter' && handleSendFollowUp()}
                  placeholder="Ask a follow-up question..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sendingMessage}
                />
                <button
                  onClick={handleSendFollowUp}
                  disabled={!followUpQuestion.trim() || sendingMessage}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Did this solve your problem?</h3>
              <div className="flex gap-4">
                <button
                  onClick={handleProblemResolved}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  ✓ Yes, Problem Solved!
                </button>
                <button
                  onClick={handleNeedProfessional}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  → I Need Professional Help
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Describe Your Problem</h1>
          <p className="text-gray-600 mb-8">
            Tell us what's wrong. You can try our AI diagnosis first, or skip straight to hiring a local professional.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problem Category
              </label>
              <select
                value={problem.category}
                onChange={(e) => setProblem({ ...problem, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="hvac">HVAC (Heating & Cooling)</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="general_maintenance">General Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe the Problem
              </label>
              <textarea
                value={problem.description}
                onChange={(e) => setProblem({ ...problem, description: e.target.value })}
                rows={6}
                placeholder="Be as detailed as possible. What's happening? When did it start? Have you tried anything?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={10}
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum 10 characters. The more details, the better we can help!
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location {problem.location.street && <span className="text-green-600 text-xs">(Pre-filled from your profile)</span>}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Street Address"
                  value={problem.location.street}
                  onChange={(e) => setProblem({ ...problem, location: { ...problem.location, street: e.target.value } })}
                  className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="City"
                  value={problem.location.city}
                  onChange={(e) => setProblem({ ...problem, location: { ...problem.location, city: e.target.value } })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="State"
                  value={problem.location.state}
                  onChange={(e) => setProblem({ ...problem, location: { ...problem.location, state: e.target.value } })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={problem.location.zipCode}
                  onChange={(e) => setProblem({ ...problem, location: { ...problem.location, zipCode: e.target.value } })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos or Videos (Optional)
              </label>
              <PhotoUpload
                onPhotosChange={(urls) => setProblem({ ...problem, mediaUrls: urls })}
                maxPhotos={5}
                context="job_request"
              />
            </div>

            <div className="border-t pt-6">
              <p className="text-sm font-medium text-gray-700 mb-4">What would you like to do?</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="submit"
                  disabled={loading || problem.description.length < 10}
                  className="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <div>
                      <div className="font-semibold">Try AI First</div>
                      <div className="text-xs opacity-90">Free diagnosis & DIY steps</div>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleSkipToHire}
                  disabled={loading || problem.description.length < 10}
                  className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <div className="font-semibold">Hire Professional</div>
                      <div className="text-xs opacity-90">Skip to local experts</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
