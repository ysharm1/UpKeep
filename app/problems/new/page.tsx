'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PhotoUpload from '@/app/components/PhotoUpload'

export default function NewProblemPage() {
  const router = useRouter()
  const [step, setStep] = useState<'describe' | 'ai-diagnosis' | 'resolved' | 'submitted'>('describe')
  const [problem, setProblem] = useState({
    category: 'hvac',
    propertyType: 'residential',
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
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [followUpQuestion, setFollowUpQuestion] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [partnersNotified, setPartnersNotified] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch user profile and auto-populate address
  useEffect(() => {
    if (!mounted) return
    
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
      }
    }

    fetchProfile()
  }, [router, mounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('accessToken')
      
      // Create job request
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: problem.category,
          propertyType: problem.propertyType,
          description: problem.description,
          mediaUrls: problem.mediaUrls,
          location: {
            ...problem.location,
            latitude: 37.7749,
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
      setPartnersNotified(data.partnersNotified || 0)

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
        setChatMessages([
          { role: 'user', content: problem.description },
          { role: 'assistant', content: diagnosis.diagnosis || 'Here are some solutions to try...' }
        ])
        setStep('ai-diagnosis')
      } else {
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

  const handleSkipToHire = async () => {
    if (problem.description.length < 10) {
      alert('Please describe your problem in at least 10 characters')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: problem.category,
          propertyType: problem.propertyType,
          description: problem.description,
          mediaUrls: problem.mediaUrls,
          location: {
            ...problem.location,
            latitude: 37.7749,
            longitude: -122.4194,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create problem')
      }

      const data = await response.json()
      setPartnersNotified(data.partnersNotified || 0)
      setStep('submitted')
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

  if (step === 'submitted') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pros Notified!</h2>
          <p className="text-gray-600 mb-4">
            {partnersNotified} local {problem.category.toUpperCase()} professionals have been notified via SMS.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next:</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex gap-2">
                <span>1.</span>
                <span>Pros review your problem and decide if they want to compete</span>
              </li>
              <li className="flex gap-2">
                <span>2.</span>
                <span>They'll call or text you directly to discuss your needs</span>
              </li>
              <li className="flex gap-2">
                <span>3.</span>
                <span>Compare quotes and choose the best pro for your job</span>
              </li>
            </ul>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Expect calls or texts from local professionals soon!
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

  if (step === 'ai-diagnosis') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Diagnosis & Solution</h2>
            
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Good news!</strong> {partnersNotified} local pros have been notified and will contact you soon.
              </p>
              <p className="text-sm text-blue-800 mt-2">
                Meanwhile, try these AI-suggested solutions - they might save you time and money!
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

            <div className="border-t pt-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">💬 Have questions? Ask the AI!</h3>
              
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

              <div className="flex gap-2">
                <input
                  type="text"
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendFollowUp()}
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
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                >
                  Back to Dashboard
                </button>
              </div>
              <p className="text-sm text-gray-500 text-center mt-3">
                Remember: {partnersNotified} pros will contact you soon!
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Navigation */}
      <nav className="max-w-2xl mx-auto mb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Your Home Repair Problem</h1>
          <p className="text-gray-600 mb-8">
            Tell us what's wrong and we'll connect you with local professionals - completely FREE for homeowners!
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <select
                value={problem.propertyType}
                onChange={(e) => setProblem({ ...problem, propertyType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="residential">Residential (Single Home)</option>
                <option value="multi_family">Multi-Family / Property Manager</option>
                <option value="commercial">Commercial Building</option>
              </select>
            </div>

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
                Minimum 10 characters. The more details, the better!
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
              <p className="text-sm font-medium text-gray-700 mb-4">Choose your path:</p>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <div className="font-semibold">Get Quotes from Professionals</div>
                      <div className="text-xs opacity-90">Skip AI, notify pros now</div>
                    </div>
                  </div>
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-4">
                Both options notify local pros. AI diagnosis is optional and might help you fix it yourself!
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
