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
            Connect with Local Home Repair Pros
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Submit your home repair problem for FREE and get connected with trusted local professionals. 
            No upfront costs - vendors compete for your business.
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
              <h3 className="text-xl font-semibold mb-2">Get AI Insights</h3>
              <p className="text-gray-600">
                Optional AI analysis with DIY tips and troubleshooting suggestions
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold mb-2">Vendors Contact You</h3>
              <p className="text-gray-600">
                Local pros view your lead and reach out directly to help
              </p>
            </div>
          </div>

          <Link
            href="/auth/register?role=homeowner"
            className="px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 font-semibold inline-block"
          >
            Submit Your Problem - FREE
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
              <h4 className="font-semibold mb-2">Vendors Get Notified</h4>
              <p className="text-gray-600 text-sm">Local pros in your area are alerted about your problem</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                3
              </div>
              <h4 className="font-semibold mb-2">They Contact You</h4>
              <p className="text-gray-600 text-sm">Interested vendors reach out directly to discuss your needs</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                4
              </div>
              <h4 className="font-semibold mb-2">Choose Your Pro</h4>
              <p className="text-gray-600 text-sm">Compare options and hire the best fit for your job</p>
            </div>
          </div>
        </div>

        <div className="mt-24 bg-blue-50 rounded-2xl p-12">
          <h3 className="text-3xl font-bold mb-6 text-center">Why Choose UpKeep?</h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex items-start">
              <span className="text-green-500 mr-3 text-xl">✓</span>
              <div>
                <h4 className="font-semibold mb-1">100% Free for Homeowners</h4>
                <p className="text-gray-600 text-sm">No upfront costs - submit your problem at no charge</p>
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
                <h4 className="font-semibold mb-1">Multiple Vendors Compete</h4>
                <p className="text-gray-600 text-sm">Get contacted by multiple pros - choose the best fit</p>
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

      {/* For Service Providers */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">Are You a Service Professional?</h3>
              <p className="text-gray-300 mb-6 text-lg">
                Get qualified leads delivered to your phone. Only pay for leads you want — no subscriptions, no contracts.
              </p>
              <ul className="space-y-3 text-gray-300 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">&#10003;</span>
                  <span>SMS alerts for new leads in your area</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">&#10003;</span>
                  <span>Pay per lead — $40 residential, $60 multi-family, $80 commercial</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">&#10003;</span>
                  <span>Full customer contact info — call them directly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">&#10003;</span>
                  <span>No monthly fees or long-term commitments</span>
                </li>
              </ul>
              <Link
                href="/auth/register?role=service_provider"
                className="px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 font-semibold inline-block"
              >
                Join as a Pro
              </Link>
            </div>
            <div className="bg-gray-800 rounded-xl p-8">
              <h4 className="text-xl font-semibold mb-4">How Providers Earn</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <div>
                    <p className="font-medium">Set up your profile</p>
                    <p className="text-gray-400 text-sm">Choose your specialties and service area</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                  <div>
                    <p className="font-medium">Get notified of new leads</p>
                    <p className="text-gray-400 text-sm">Instant SMS when a homeowner needs help</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                  <div>
                    <p className="font-medium">Purchase &amp; contact the customer</p>
                    <p className="text-gray-400 text-sm">Pay once, get full details, close the deal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-600">
            <p>&copy; {new Date().getFullYear()} UpKeep. All rights reserved.</p>
            <p className="mt-2">HVAC &bull; Plumbing &bull; Electrical &bull; Home Maintenance</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
