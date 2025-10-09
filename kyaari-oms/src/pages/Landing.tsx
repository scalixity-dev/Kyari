import { Link } from 'react-router-dom'
import { Users, Package, FileText, LayoutDashboard } from 'lucide-react'

function Landing() {
  return (
    <div className="flex w-full min-h-screen items-center justify-center px-5 py-10 bg-[var(--color-sharktank-bg)] box-border overflow-x-hidden">
      <div className="w-full max-w-4xl mx-auto -mt-14 sm:-mt-[4.5rem] px-1">
        <h1 className="mb-12 text-center text-[clamp(1.5rem,1rem+3.5vw,2.75rem)] leading-[1.05] font-[var(--font-heading)] font-[var(--fw-regular)] text-[var(--color-heading)] px-2">
          Choose a Dashboard
        </h1>

        {/* ↓ Reduced gap between cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 mt-8">
          <Link 
            to="/admin/signin" 
            className="rounded-xl border border-gray-200/90 bg-white p-4 sm:p-5 lg:p-6 text-center shadow-sm transition-all duration-150 ease-in-out hover:shadow-[0_6px_12px_-4px_rgba(0,0,0,0.12)] hover:border-[var(--color-accent)] hover:text-[var(--color-secondary)] hover:-translate-y-0.5 focus:outline-none focus-visible:outline-[3px] focus-visible:outline-green-500/15 focus-visible:outline-offset-[3px] no-underline font-[var(--font-body)] font-[var(--fw-medium)] text-[var(--color-primary)] flex items-center justify-center min-h-[56px] sm:min-h-[64px] lg:min-h-[72px] cursor-pointer [&>*]:pointer-events-none"
            aria-label="Go to Admin dashboard"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#C3754C] rounded-full flex items-center justify-center text-white shadow-md">
              <Users size={32} />
            </div>
            <span className="text-lg font-semibold text-gray-800">Admin</span>
          </Link>

          <Link 
            to="/vendors/signin" 
            className="rounded-xl border border-gray-200/90 bg-white p-4 sm:p-5 lg:p-6 text-center shadow-sm transition-all duration-150 ease-in-out hover:shadow-[0_6px_12px_-4px_rgba(0,0,0,0.12)] hover:border-[var(--color-accent)] hover:text-[var(--color-secondary)] hover:-translate-y-0.5 focus:outline-none focus-visible:outline-[3px] focus-visible:outline-green-500/15 focus-visible:outline-offset-[3px] no-underline font-[var(--font-body)] font-[var(--fw-medium)] text-[var(--color-primary)] flex items-center justify-center min-h-[56px] sm:min-h-[64px] lg:min-h-[72px] cursor-pointer [&>*]:pointer-events-none"
            aria-label="Go to Vendors dashboard"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#C3754C] rounded-full flex items-center justify-center text-white shadow-md">
              <Package size={32} />
            </div>
            <span className="text-lg font-semibold text-gray-800">Vendors</span>
          </Link>

          <Link 
            to="/accounts/signin" 
            className="rounded-xl border border-gray-200/90 bg-white p-4 sm:p-5 lg:p-6 text-center shadow-sm transition-all duration-150 ease-in-out hover:shadow-[0_6px_12px_-4px_rgba(0,0,0,0.12)] hover:border-[var(--color-accent)] hover:text-[var(--color-secondary)] hover:-translate-y-0.5 focus:outline-none focus-visible:outline-[3px] focus-visible:outline-green-500/15 focus-visible:outline-offset-[3px] no-underline font-[var(--font-body)] font-[var(--fw-medium)] text-[var(--color-primary)] flex items-center justify-center min-h-[56px] sm:min-h-[64px] lg:min-h-[72px] cursor-pointer [&>*]:pointer-events-none"
            aria-label="Go to Accounts dashboard"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#C3754C] rounded-full flex items-center justify-center text-white shadow-md">
              <FileText size={32} />
            </div>
            <span className="text-lg font-semibold text-gray-800">Accounts</span>
          </Link>

          <Link 
            to="/operations/signin" 
            className="rounded-xl border border-gray-200/90 bg-white p-4 sm:p-5 lg:p-6 text-center shadow-sm transition-all duration-150 ease-in-out hover:shadow-[0_6px_12px_-4px_rgba(0,0,0,0.12)] hover:border-[var(--color-accent)] hover:text-[var(--color-secondary)] hover:-translate-y-0.5 focus:outline-none focus-visible:outline-[3px] focus-visible:outline-green-500/15 focus-visible:outline-offset-[3px] no-underline font-[var(--font-body)] font-[var(--fw-medium)] text-[var(--color-primary)] flex items-center justify-center min-h-[56px] sm:min-h-[64px] lg:min-h-[72px] cursor-pointer [&>*]:pointer-events-none"
            aria-label="Go to Operations dashboard"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#C3754C] rounded-full flex items-center justify-center text-white shadow-md">
              <LayoutDashboard size={32} />
            </div>
            <span className="text-lg font-semibold text-gray-800">Operations</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Landing
