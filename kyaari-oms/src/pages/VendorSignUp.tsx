import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiService } from '../services/api'
import type { RegisterVendorRequest } from '../services/api'

export default function VendorSignUp() {
  const [contactPersonName, setContactPersonName] = useState('')
  const [email, setEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [warehouseLocation, setWarehouseLocation] = useState('')
  const [pincode, setPincode] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [panNumber, setPanNumber] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validation
    if (!contactPersonName.trim()) {
      setError('Please enter contact person name')
      return
    }
    if (!email.trim()) {
      setError('Please enter an email')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email')
      return
    }
    if (!contactPhone.trim()) {
      setError('Please enter contact phone number')
      return
    }
    if (!/^\+?[\d\s\-\(\)]{10,20}$/.test(contactPhone)) {
      setError('Please enter a valid phone number (10-20 digits)')
      return
    }
    if (!password) {
      setError('Please enter a password')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!warehouseLocation.trim()) {
      setError('Please enter the warehouse location')
      return
    }
    if (!/^[0-9]{6}$/.test(pincode)) {
      setError('Please enter a valid 6-digit pincode')
      return
    }
    if (!panNumber.trim()) {
      setError('Please enter PAN number')
      return
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber.toUpperCase())) {
      setError('Please enter a valid PAN number (e.g., ABCDE1234F)')
      return
    }
    if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstNumber.toUpperCase())) {
      setError('Please enter a valid GST number (15 characters)')
      return
    }

    setIsLoading(true)
    try {
      const registrationData: RegisterVendorRequest = {
        contactPersonName: contactPersonName.trim(),
        email: email.trim(),
        contactPhone: contactPhone.trim(),
        password,
        confirmPassword,
        warehouseLocation: warehouseLocation.trim(),
        pincode: pincode.trim(),
        companyName: companyName.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
        panNumber: panNumber.trim().toUpperCase()
      }

      await ApiService.registerVendor(registrationData)
      
      // Show success message and redirect to vendor sign in
      navigate('/vendors/signin', { 
        state: { 
          message: 'Registration successful! Please wait for admin approval before signing in.' 
        } 
      })
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-8 bg-[color:var(--color-header-bg)] box-border">
      <div className="w-full max-w-[560px] bg-white p-8 rounded-[12px] shadow-[0_8px_20px_rgba(0,0,0,0.08)] text-center box-border">
        <h2 className="font-[var(--font-heading)] text-[color:var(--color-heading)] mb-4 text-2xl">Vendor Sign Up</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="text-sm text-left text-[color:var(--color-primary)]">
            <div>Contact Person Name *</div>
            <input 
              value={contactPersonName} 
              onChange={(e) => setContactPersonName(e.target.value)} 
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200" 
              placeholder="Full name of contact person" 
              required
            />
          </label>

          <label className="text-sm text-left text-[color:var(--color-primary)]">
            <div>Company Name</div>
            <input 
              value={companyName} 
              onChange={(e) => setCompanyName(e.target.value)} 
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200" 
              placeholder="Your company/business name" 
            />
          </label>

          <label className="text-sm text-left text-[color:var(--color-primary)]">
            <div>Email *</div>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200" 
              placeholder="vendor@company.com" 
              required
            />
          </label>

          <label className="text-sm text-left text-[color:var(--color-primary)]">
            <div>Contact Phone *</div>
            <input
              value={contactPhone}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, '')
                setContactPhone(v.slice(0, 10))
              }}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200"
              placeholder="e.g. 9876543210"
              required
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm text-left text-[color:var(--color-primary)]">
              <div>Password *</div>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200" 
                placeholder="••••••••" 
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                Must contain uppercase, lowercase, digit, and special character
              </div>
            </label>

            <label className="text-sm text-left text-[color:var(--color-primary)]">
              <div>Confirm Password *</div>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200" 
                placeholder="Confirm password" 
                required
              />
            </label>
          </div>

          <label className="text-sm text-left text-[color:var(--color-primary)]">
            <div>Warehouse Location *</div>
            <input 
              value={warehouseLocation} 
              onChange={(e) => setWarehouseLocation(e.target.value)} 
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200" 
              placeholder="City, State or Full Address" 
              required
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm text-left text-[color:var(--color-primary)]">
              <div>Pincode *</div>
              <input
                value={pincode}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '')
                  setPincode(v.slice(0, 6))
                }}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200"
                placeholder="e.g. 560001"
                required
              />
            </label>

            <label className="text-sm text-left text-[color:var(--color-primary)]">
              <div>PAN Number *</div>
              <input
                value={panNumber}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                  setPanNumber(v.slice(0, 10))
                }}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200"
                placeholder="e.g. ABCDE1234F"
                required
              />
            </label>
          </div>

          <label className="text-sm text-left text-[color:var(--color-primary)]">
            <div>GST Number (Optional)</div>
            <input
              value={gstNumber}
              onChange={(e) => {
                const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                setGstNumber(v.slice(0, 15))
              }}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200"
              placeholder="e.g. 22ABCDE1234F1Z5"
            />
          </label>

          {error && <div className="text-red-700 text-sm text-left">{error}</div>}

          <button 
            type="submit" 
            className="mt-2 bg-[color:var(--color-accent)] text-[color:var(--color-button-text)] py-3 rounded-lg font-[var(--fw-bold)] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="mt-2 text-sm text-[color:var(--color-primary)] flex justify-center gap-2">
            <span>Already have an account?</span>
            <Link to="/vendors/signin" className="text-[color:var(--color-accent)] font-[var(--fw-medium)] underline">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
