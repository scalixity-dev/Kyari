import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function VendorSignUp() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [pincode, setPincode] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter first and last name')
      return
    }
    if (!email.trim()) {
      setError('Please enter an email')
      return
    }
    // simple email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email')
      return
    }
    if (!password) {
      setError('Please enter a password')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!warehouse.trim()) {
      setError('Please enter the warehouse location')
      return
    }
    if (!/^[0-9]{4,6}$/.test(pincode)) {
      setError('Please enter a valid pincode (4-6 digits)')
      return
    }

    // if phone provided, require exactly 10 digits starting with 6-9
    if (phone && !/^[6-9][0-9]{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number (starting with 6-9)')
      return
    }

    // placeholder register — reuse login to persist user locally for now
    login(email, password)
    navigate('/vendors')
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-8 bg-[color:var(--color-header-bg)] box-border">
      <div className="w-full max-w-[560px] bg-white p-8 rounded-[12px] shadow-[0_8px_20px_rgba(0,0,0,0.08)] text-center box-border">
        <h2 className="font-[var(--font-heading)] text-[color:var(--color-heading)] mb-4 text-2xl">Vendor Sign Up</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm text-left text-[color:var(--color-primary)]">
              <div>First Name</div>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200" placeholder="First name" />
            </label>

            <label className="text-sm text-left text-[color:var(--color-primary)]">
              <div>Last Name</div>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200" placeholder="Last name" />
            </label>
          </div>

          <label className="text-sm text-left text-[color:var(--color-primary)]">
            <div>Email</div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200" placeholder="vendor@kyari.com" />
          </label>

          <label className="text-sm text-left text-[color:var(--color-primary)]">
            <div>Phone</div>
            <input
              value={phone}
              onChange={(e) => {
                // allow digits only; max 10 for Indian mobile
                const v = e.target.value.replace(/[^0-9]/g, '')
                setPhone(v.slice(0, 10))
              }}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200"
              placeholder="e.g. 9876543210"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm text-left text-[color:var(--color-primary)]">
              <div>Password</div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200" placeholder="••••••••" />
            </label>

            <label className="text-sm text-left text-[color:var(--color-primary)]">
              <div>Confirm Password</div>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200" placeholder="Confirm password" />
            </label>
          </div>

          <label className="text-sm text-left text-[color:var(--color-primary)]">
            <div>Warehouse Location</div>
            <input value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200" placeholder="City, State or Address" />
          </label>

          <label className="text-sm text-left text-[color:var(--color-primary)]">
            <div>Pincode</div>
            <input
              value={pincode}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, '')
                setPincode(v.slice(0, 6))
              }}
              className={"w-[140px] mt-1 px-3 py-2 rounded-lg border border-gray-200"}
              placeholder="e.g. 560001"
            />
          </label>

          {error && <div className="text-red-700 text-sm text-left">{error}</div>}

          <button type="submit" className="mt-2 bg-[color:var(--color-accent)] text-[color:var(--color-button-text)] py-3 rounded-lg font-[var(--fw-bold)]">Create account</button>

          <div className="mt-2 text-sm text-[color:var(--color-primary)] flex justify-center gap-2">
            <span>Already have an account?</span>
            <Link to="/vendors/signin" className="text-[color:var(--color-accent)] font-[var(--fw-medium)] underline">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
