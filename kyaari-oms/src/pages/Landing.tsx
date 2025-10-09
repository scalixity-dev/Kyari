import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="flex w-full min-h-screen items-center justify-center px-5 py-10 bg-[var(--color-sharktank-bg)] box-border overflow-x-hidden">
  <div className="w-full max-w-3xl mx-auto -mt-14 sm:-mt-[4.5rem] px-1">
        <h1 className="mb-4 text-center text-[clamp(1.5rem,1rem+3.5vw,2.75rem)] leading-[1.05] font-[var(--font-heading)] font-[var(--fw-regular)] text-[var(--color-heading)] px-2">
          Choose a Dashboard
        </h1>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3.5 sm:gap-4 lg:gap-5">
          <Link 
            to="/admin/signin" 
            className="rounded-xl border border-gray-200/90 bg-white p-4 sm:p-5 lg:p-6 text-center shadow-sm transition-all duration-150 ease-in-out hover:shadow-[0_6px_12px_-4px_rgba(0,0,0,0.12)] hover:border-[var(--color-accent)] hover:text-[var(--color-secondary)] hover:-translate-y-0.5 focus:outline-none focus-visible:outline-[3px] focus-visible:outline-green-500/15 focus-visible:outline-offset-[3px] no-underline font-[var(--font-body)] font-[var(--fw-medium)] text-[var(--color-primary)] flex items-center justify-center min-h-[56px] sm:min-h-[64px] lg:min-h-[72px] cursor-pointer [&>*]:pointer-events-none"
            aria-label="Go to Admin dashboard"
          >
            Admin
          </Link>
          <Link 
            to="/vendors/signin" 
            className="rounded-xl border border-gray-200/90 bg-white p-4 sm:p-5 lg:p-6 text-center shadow-sm transition-all duration-150 ease-in-out hover:shadow-[0_6px_12px_-4px_rgba(0,0,0,0.12)] hover:border-[var(--color-accent)] hover:text-[var(--color-secondary)] hover:-translate-y-0.5 focus:outline-none focus-visible:outline-[3px] focus-visible:outline-green-500/15 focus-visible:outline-offset-[3px] no-underline font-[var(--font-body)] font-[var(--fw-medium)] text-[var(--color-primary)] flex items-center justify-center min-h-[56px] sm:min-h-[64px] lg:min-h-[72px] cursor-pointer [&>*]:pointer-events-none"
            aria-label="Go to Vendors dashboard"
          >
            Vendors
          </Link>
          <Link 
            to="/accounts/signin" 
            className="rounded-xl border border-gray-200/90 bg-white p-4 sm:p-5 lg:p-6 text-center shadow-sm transition-all duration-150 ease-in-out hover:shadow-[0_6px_12px_-4px_rgba(0,0,0,0.12)] hover:border-[var(--color-accent)] hover:text-[var(--color-secondary)] hover:-translate-y-0.5 focus:outline-none focus-visible:outline-[3px] focus-visible:outline-green-500/15 focus-visible:outline-offset-[3px] no-underline font-[var(--font-body)] font-[var(--fw-medium)] text-[var(--color-primary)] flex items-center justify-center min-h-[56px] sm:min-h-[64px] lg:min-h-[72px] cursor-pointer [&>*]:pointer-events-none"
            aria-label="Go to Accounts dashboard"
          >
            Accounts
          </Link>
          <Link 
            to="/operations/signin" 
            className="rounded-xl border border-gray-200/90 bg-white p-4 sm:p-5 lg:p-6 text-center shadow-sm transition-all duration-150 ease-in-out hover:shadow-[0_6px_12px_-4px_rgba(0,0,0,0.12)] hover:border-[var(--color-accent)] hover:text-[var(--color-secondary)] hover:-translate-y-0.5 focus:outline-none focus-visible:outline-[3px] focus-visible:outline-green-500/15 focus-visible:outline-offset-[3px] no-underline font-[var(--font-body)] font-[var(--fw-medium)] text-[var(--color-primary)] flex items-center justify-center min-h-[56px] sm:min-h-[64px] lg:min-h-[72px] cursor-pointer [&>*]:pointer-events-none"
            aria-label="Go to Operations dashboard"
          >
            Operations
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Landing


