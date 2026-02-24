import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">UpKeep</h1>
            </div>
            <div className="flex gap-4">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Home Repairs Made Simple
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Get instant AI diagnostics and connect with trusted local professionals for HVAC,
            plumbing, electrical, and home maintenance. Fast, reliable, affordable.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-xl font-semibold mb-2">Upload Photos</h3>
              <p className="text-gray-600">
                Take a photo of your problem and describe what's happening
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">Get AI Diagnosis</h3>
              <p className="text-gray-600">
                Instant analysis with DIY tips or professional recommendation
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold mb-2">Book a Pro</h3>
              <p className="text-gray-600">
                We connect you with a trusted local expert who'll fix it right
              </p>
            </div>
          </div>

          <Link
            href="/auth/register?role=homeowner"
            className="px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 font-semibold inline-block"
          >
            Get Help Now - $85 Diagnostic
          </Link>
        </div>

        <div className="mt-24">
          <h3 className="text-3xl font-bold mb-8 text-center">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                1
              </div>
              <h4 className="font-semibold mb-2">Describe Your Problem</h4>
              <p className="text-gray-600 text-sm">Upload photos and tell us what's wrong</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                2
              </div>
              <h4 className="font-semibold mb-2">AI Analysis</h4>
              <p className="text-gray-600 text-sm">Get instant diagnosis and recommendations</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                3
              </div>
              <h4 className="font-semibold mb-2">Expert Visits</h4>
              <p className="text-gray-600 text-sm">Local pro comes out for $85 diagnostic</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                4
              </div>
              <h4 className="font-semibold mb-2">Get It Fixed</h4>
              <p className="text-gray-600 text-sm">Approve the quote and we'll handle the rest</p>
            </div>
          </div>
        </div>

        <div className="mt-24 bg-blue-50 rounded-2xl p-12">
          <h3 className="text-3xl font-bold mb-6 text-center">Why Choose UpKeep?</h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex items-start">
              <span className="text-green-500 mr-3 text-xl">✓</span>
              <div>
                <h4 className="font-semibold mb-1">Instant AI Diagnostics</h4>
                <p className="text-gray-600 text-sm">Know what's wrong before anyone comes out</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-3 text-xl">✓</span>
              <div>
                <h4 className="font-semibold mb-1">Trusted Local Pros</h4>
                <p className="text-gray-600 text-sm">Licensed, insured, and background-checked</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-3 text-xl">✓</span>
              <div>
                <h4 className="font-semibold mb-1">Transparent Pricing</h4>
                <p className="text-gray-600 text-sm">$85 diagnostic, clear quotes before work starts</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-3 text-xl">✓</span>
              <div>
                <h4 className="font-semibold mb-1">Fast Response</h4>
                <p className="text-gray-600 text-sm">Get help within hours, not days</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 UpKeep. All rights reserved.</p>
            <p className="mt-2">HVAC • Plumbing • Electrical • Home Maintenance</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
