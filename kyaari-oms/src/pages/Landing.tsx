import { Link } from 'react-router-dom'
import { Users, Package, FileText, LayoutDashboard } from 'lucide-react'

function Landing() {
  return (
    <div className="flex w-full min-h-screen items-center justify-center bg-[#FAF8EF]">
      <div className="text-center">
        <h1 className="mb-12 text-center text-[clamp(1.5rem,1rem+3.5vw,2.75rem)] leading-[1.05] font-[var(--font-heading)] font-[var(--fw-regular)] text-[var(--color-heading)] px-2">Choose a Dashboard</h1>

        <div className="grid grid-cols-2 gap-x-6 gap-y-6 justify-center">
          {/* Admin */}
          <Link
            to="/admin/signin"
            className="flex flex-col items-center justify-center bg-white shadow-md rounded-xl w-64 h-32 transition-transform hover:scale-105"
          >
            <div className="bg-[var(--color-accent)] p-3 rounded-full mb-2">
              <Users className="w-10 h-10 text-white" />
            </div>
            <p className="text-[var(--color-heading)] font-[var(--font-heading)] font-[var(--fw-regular)] text-lg sm:text-xl">Admin</p>
          </Link>

          {/* Vendors */}
          <Link
            to="/vendors/signin"
            className="flex flex-col items-center justify-center bg-white shadow-md rounded-xl w-64 h-32 transition-transform hover:scale-105"
          >
            <div className="bg-[var(--color-accent)] p-3 rounded-full mb-2">
              <Package className="w-10 h-10 text-white" />
            </div>
            <p className="text-[var(--color-heading)] font-[var(--font-heading)] font-[var(--fw-regular)] text-lg sm:text-xl">Vendors</p>
          </Link>

          {/* Accounts */}
          <Link
            to="/accounts/signin"
            className="flex flex-col items-center justify-center bg-white shadow-md rounded-xl w-64 h-32 transition-transform hover:scale-105"
          >
            <div className="bg-[var(--color-accent)] p-3 rounded-full mb-2">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <p className="text-[var(--color-heading)] font-[var(--font-heading)] font-[var(--fw-regular)] text-lg sm:text-xl">Accounts</p>
          </Link>

          {/* Operations */}
          <Link
            to="/operations/signin"
            className="flex flex-col items-center justify-center bg-white shadow-md rounded-xl w-64 h-32 transition-transform hover:scale-105"
          >
            <div className="bg-[var(--color-accent)] p-3 rounded-full mb-2">
              <LayoutDashboard className="w-10 h-10 text-white" />
            </div>
            <p className="text-[var(--color-heading)] font-[var(--font-heading)] font-[var(--fw-regular)] text-lg sm:text-xl">Operations</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Landing
