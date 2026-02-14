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
                Sign Up
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
            Get AI-powered diagnostics and connect with verified local professionals for HVAC,
            plumbing, electrical, and home maintenance services.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI Diagnostics</h3>
              <p className="text-gray-600">
                Upload photos and get instant AI-powered problem analysis with DIY solutions
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold mb-2">Verified Pros</h3>
              <p className="text-gray-600">
                Connect with licensed, insured professionals in your area with ratings and reviews
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                Safe, transparent pricing with payment protection and satisfaction guarantee
              </p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/register?role=homeowner"
              className="px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 font-semibold"
            >
              I Need Help
            </Link>
            <Link
              href="/auth/register?role=service_provider"
              className="px-8 py-4 bg-gray-800 text-white text-lg rounded-lg hover:bg-gray-900 font-semibold"
            >
              I'm a Pro
            </Link>
          </div>
        </div>

        <div className="mt-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold mb-4">For Homeowners</h3>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Submit problems with photos and videos</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Get AI-powered diagnostics and DIY guidance</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Match with top-rated local professionals</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Secure payments with satisfaction guarantee</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-3xl font-bold mb-4">For Service Providers</h3>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Receive qualified leads in your service area</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Build your reputation with ratings and reviews</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Manage jobs and communicate with clients</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Fast, secure payments directly to your account</span>
              </li>
            </ul>
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
