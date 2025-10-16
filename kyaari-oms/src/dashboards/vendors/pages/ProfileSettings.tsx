import { useState } from 'react'
import { Bell, Package, AlertTriangle } from 'lucide-react'

interface CompanyDetails {
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address: string
  gstNumber: string
  panNumber: string
  bankName: string
  accountNumber: string
  ifscCode: string
  accountHolderName: string
}

interface NotificationPreferences {
  orderNotifications: boolean
  paymentNotifications: boolean
  dispatchNotifications: boolean
  systemAlerts: boolean
  emailDigest: boolean
  smsNotifications: boolean
  performanceReports: boolean
  maintenanceAlerts: boolean
}

const initialCompanyDetails: CompanyDetails = {
  companyName: 'Fresh Farms Pvt Ltd',
  contactPerson: 'Rajesh Kumar',
  email: 'contact@freshfarms.in',
  phone: '+91 9876543210',
  address: '123 Agriculture Road, Farm Colony, Mumbai, Maharashtra 400001',
  gstNumber: '27AABCU9603R1ZX',
  panNumber: 'AABCU9603R',
  bankName: 'HDFC Bank',
  accountNumber: '50100123456789',
  ifscCode: 'HDFC0001234',
  accountHolderName: 'Fresh Farms Pvt Ltd'
}



const initialNotificationPreferences: NotificationPreferences = {
  orderNotifications: true,
  paymentNotifications: true,
  dispatchNotifications: true,
  systemAlerts: true,
  emailDigest: false,
  smsNotifications: true,
  performanceReports: false,
  maintenanceAlerts: true
}

// role/status badges removed with user management

export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState<'company' | 'notifications'>('company')
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>(initialCompanyDetails)
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(initialNotificationPreferences)
  const [isEditing, setIsEditing] = useState(false)

  const handleCompanyDetailsChange = (field: keyof CompanyDetails, value: string) => {
    setCompanyDetails(prev => ({ ...prev, [field]: value }))
  }

  const handleNotificationChange = (field: keyof NotificationPreferences) => {
    setNotificationPreferences(prev => ({ ...prev, [field]: !prev[field] }))
  }

  // user management removed — helper functions and state were eliminated

  const tabs = [
    { id: 'company', label: 'Company Details', icon: Package },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ]

  return (
    <div className="py-4 px-4 sm:px-6 md:px-8 lg:px-9 sm:py-6 lg:py-8 min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden" style={{ background: 'var(--color-sharktank-bg)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--color-heading)] mb-0 sm:mb-0 font-[var(--font-heading)]">Profile & Settings</h2>
      </div>

      {/* Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="relative min-w-max">
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--color-accent)] rounded-full opacity-80"></div>
          <div className="relative flex gap-2 sm:gap-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`
                    px-5 py-2.5 font-semibold outline-none whitespace-nowrap text-sm sm:text-base transition-all duration-200
                    rounded-t-xl rounded-b-none min-h-[44px] flex items-center gap-2
                    ${isActive 
                      ? 'bg-[var(--color-accent)] text-[var(--color-button-text)] shadow-[0_4px_12px_rgba(0,0,0,0.08)]' 
                      : 'bg-transparent text-[var(--color-secondary)] hover:text-[var(--color-heading)]'}
                  `}
                >
                  <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'company' && (
          <div className="bg-white rounded-xl shadow-md border border-white/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)]">Company Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent)]/90 transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                {isEditing ? 'Save Changes' : 'Edit Details'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Basic Information */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-medium text-[var(--color-heading)] mb-3 sm:mb-4">Basic Information</h3>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={companyDetails.companyName}
                    onChange={(e) => handleCompanyDetailsChange('companyName', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={companyDetails.contactPerson}
                    onChange={(e) => handleCompanyDetailsChange('contactPerson', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={companyDetails.email}
                    onChange={(e) => handleCompanyDetailsChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={companyDetails.phone}
                    onChange={(e) => handleCompanyDetailsChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={companyDetails.address}
                    onChange={(e) => handleCompanyDetailsChange('address', e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
              </div>

              {/* Legal & Financial Information */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-medium text-[var(--color-heading)] mb-3 sm:mb-4">Legal & Financial Details</h3>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input
                    type="text"
                    value={companyDetails.gstNumber}
                    onChange={(e) => handleCompanyDetailsChange('gstNumber', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={companyDetails.panNumber}
                    onChange={(e) => handleCompanyDetailsChange('panNumber', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={companyDetails.bankName}
                    onChange={(e) => handleCompanyDetailsChange('bankName', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={companyDetails.accountNumber}
                    onChange={(e) => handleCompanyDetailsChange('accountNumber', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={companyDetails.ifscCode}
                    onChange={(e) => handleCompanyDetailsChange('ifscCode', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={companyDetails.accountHolderName}
                    onChange={(e) => handleCompanyDetailsChange('accountHolderName', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-yellow-800">Important Note</p>
                    <p className="text-xs text-yellow-700 mt-1 break-words">
                      Changes to GST, PAN, and bank details may require verification and could take 2-3 business days to process.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Management removed */}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl shadow-md border border-white/20 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)] mb-4 sm:mb-6">Notification Preferences</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Order & Business Notifications */}
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-medium text-[var(--color-heading)]">Order & Business</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-medium text-gray-800 text-sm sm:text-base">Order Notifications</p>
                      <p className="text-xs sm:text-sm text-gray-600">New orders, confirmations, and updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.orderNotifications}
                        onChange={() => handleNotificationChange('orderNotifications')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-medium text-gray-800 text-sm sm:text-base">Payment Notifications</p>
                      <p className="text-xs sm:text-sm text-gray-600">Payment releases and invoice updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.paymentNotifications}
                        onChange={() => handleNotificationChange('paymentNotifications')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-medium text-gray-800 text-sm sm:text-base">Dispatch Notifications</p>
                      <p className="text-xs sm:text-sm text-gray-600">Dispatch confirmations and delivery updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.dispatchNotifications}
                        onChange={() => handleNotificationChange('dispatchNotifications')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-medium text-gray-800 text-sm sm:text-base">Performance Reports</p>
                      <p className="text-xs sm:text-sm text-gray-600">Weekly and monthly performance summaries</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.performanceReports}
                        onChange={() => handleNotificationChange('performanceReports')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* System & Communication Notifications */}
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-medium text-[var(--color-heading)]">System & Communication</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-medium text-gray-800 text-sm sm:text-base">System Alerts</p>
                      <p className="text-xs sm:text-sm text-gray-600">Important system messages and updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.systemAlerts}
                        onChange={() => handleNotificationChange('systemAlerts')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-medium text-gray-800 text-sm sm:text-base">Email Digest</p>
                      <p className="text-xs sm:text-sm text-gray-600">Daily summary emails</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.emailDigest}
                        onChange={() => handleNotificationChange('emailDigest')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-medium text-gray-800 text-sm sm:text-base">SMS Notifications</p>
                      <p className="text-xs sm:text-sm text-gray-600">Critical alerts via SMS</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.smsNotifications}
                        onChange={() => handleNotificationChange('smsNotifications')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-medium text-gray-800 text-sm sm:text-base">Maintenance Alerts</p>
                      <p className="text-xs sm:text-sm text-gray-600">System maintenance and downtime notices</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPreferences.maintenanceAlerts}
                        onChange={() => handleNotificationChange('maintenanceAlerts')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Bell className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-800">Notification Delivery</p>
                  <p className="text-xs text-blue-700 mt-1 break-words">
                    Most notifications are delivered instantly. Email digests are sent daily at 9:00 AM. 
                    SMS notifications are only sent for critical alerts to avoid spam.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}