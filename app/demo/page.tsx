'use client'

import Link from 'next/link'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                UpKeep
              </Link>
            </div>
            <Link href="/" className="px-4 py-2 text-gray-700 hover:text-gray-900">
              ← Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Quote & Payment System Demo
          </h1>
          <p className="text-xl text-gray-600">
            Complete UI flow for the hybrid pricing model
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Provider Flow */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Provider Flow</h2>
            <p className="text-gray-600 mb-6">
              Service providers can set base rates and submit custom quotes for each job
            </p>

            <div className="space-y-4">
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-semibold text-gray-900 mb-1">Step 1: Set Diagnostic Fee</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Configure your diagnostic visit fee (one-time setup)
                </p>
                <Link
                  href="/provider/settings"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Settings →
                </Link>
              </div>

              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-semibold text-gray-900 mb-1">Step 2: Receive Bookings</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Homeowners book diagnostic visits instantly - payment authorized
                </p>
                <Link
                  href="/provider/dashboard"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Dashboard →
                </Link>
              </div>

              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-semibold text-gray-900 mb-1">Step 3: Visit & Submit Repair Quote</h3>
                <p className="text-sm text-gray-600 mb-2">
                  After diagnosing on-site, submit repair quote through the app
                </p>
                <Link
                  href="/provider/jobs/1/repair-quote"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Quote Form →
                </Link>
              </div>

              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-semibold text-gray-900 mb-1">Step 4: Complete Work & Get Paid</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Once homeowner approves, complete work and both payments are captured
                </p>
                <p className="text-xs text-gray-500 italic">
                  You receive 85% of total (diagnostic + repair)
                </p>
              </div>
            </div>
          </div>

          {/* Homeowner Flow */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Homeowner Flow</h2>
            <p className="text-gray-600 mb-6">
              Homeowners can view multiple quotes and accept the best option
            </p>

            <div className="space-y-4">
              <div className="border-l-4 border-green-600 pl-4">
                <h3 className="font-semibold text-gray-900 mb-1">Step 1: Submit Problem</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Describe your home repair issue with details and location
                </p>
                <Link
                  href="/problems/new"
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Submit a Problem →
                </Link>
              </div>

              <div className="border-l-4 border-green-600 pl-4">
                <h3 className="font-semibold text-gray-900 mb-1">Step 2: Book Diagnostic Visit</h3>
                <p className="text-sm text-gray-600 mb-2">
                  See providers with diagnostic fees and book instantly
                </p>
                <Link
                  href="/problems/1/professionals"
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  View Instant Booking →
                </Link>
              </div>

              <div className="border-l-4 border-green-600 pl-4">
                <h3 className="font-semibold text-gray-900 mb-1">Step 3: Receive Repair Quote</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Provider visits, diagnoses, and submits repair quote in-app
                </p>
                <p className="text-xs text-gray-500 italic">
                  Approve or decline the repair quote
                </p>
              </div>

              <div className="border-l-4 border-green-600 pl-4">
                <h3 className="font-semibold text-gray-900 mb-1">Step 4: Track Progress</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Monitor job status and payment authorization
                </p>
                <Link
                  href="/dashboard"
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  View Homeowner Dashboard →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-semibold text-gray-900">Hybrid Pricing</h3>
              </div>
              <p className="text-sm text-gray-600">
                Optional base rates for transparency + custom quotes for flexibility
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="font-semibold text-gray-900">Secure Payments</h3>
              </div>
              <p className="text-sm text-gray-600">
                Payment authorized on acceptance, captured on completion (15% platform fee)
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <h3 className="font-semibold text-gray-900">Multiple Quotes</h3>
              </div>
              <p className="text-sm text-gray-600">
                Homeowners receive and compare quotes from multiple providers
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Example */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pricing Example</h2>
          
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="font-semibold text-gray-900 mb-4">Quote Breakdown</h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Labor (2-3 hours)</span>
                <span className="font-medium">$200</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Parts (estimated)</span>
                <span className="font-medium">$150</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Service call fee</span>
                <span className="font-medium">$50</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Travel</span>
                <span className="font-medium">$25</span>
              </div>
            </div>
            
            <div className="border-t pt-3 mb-4">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total Quote</span>
                <span className="text-blue-600">$425</span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Platform fee (15%)</span>
                <span className="text-gray-900">$63.75</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-900">Provider receives (85%)</span>
                <span className="text-green-600">$361.25</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
