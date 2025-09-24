import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-3xl">
        <h1 className="mb-6 text-center text-3xl font-semibold">Choose a Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link to="/admin" className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center shadow-sm transition hover:shadow">
            Admin
          </Link>
          <Link to="/vendors" className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center shadow-sm transition hover:shadow">
            Vendors
          </Link>
          <Link to="/accounts" className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center shadow-sm transition hover:shadow">
            Accounts
          </Link>
          <Link to="/operations" className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center shadow-sm transition hover:shadow">
            Operations
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Landing


