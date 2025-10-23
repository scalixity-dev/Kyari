import { useState } from 'react'
import { Bell, CheckSquare, Eye, EyeOff, AlertTriangle } from 'lucide-react'

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  department: string
  joinDate: string
}

interface NotificationSettings {
  newOrders: boolean
  ticketUpdates: boolean
  systemAlerts: boolean
  weeklyReports: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
}

interface SecuritySettings {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const defaultProfile: UserProfile = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@kyari.com',
  phone: '+91 98765 43210',
  role: 'Operations Manager',
  department: 'Operations',
  joinDate: '2024-01-15'
}

const defaultNotifications: NotificationSettings = {
  newOrders: true,
  ticketUpdates: true,
  systemAlerts: true,
  weeklyReports: false,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true
}

export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile')
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications)
  const [security, setSecurity] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const handleProfileUpdate = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleNotificationToggle = (setting: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [setting]: !prev[setting] }))
  }

  const handleSecurityUpdate = (field: keyof SecuritySettings, value: string) => {
    setSecurity(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaveStatus('saving')
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 1000)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: CheckSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Eye }
  ]

  return (
    <div className="py-4 px-4 sm:px-6 md:px-8 lg:px-9 sm:py-6 lg:py-8 min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden" style={{ background: 'var(--color-sharktank-bg)' }}>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] mb-2">
          Profile & Settings
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-primary)]">
          Manage your profile information and account settings
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="relative min-w-max">
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--color-accent)] rounded-full opacity-80"></div>
          <div className="relative flex gap-2 sm:gap-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'profile' | 'notifications' | 'security')}
                  className={`
                    px-5 py-2.5 font-semibold outline-none whitespace-nowrap text-sm sm:text-base transition-all duration-200
                    rounded-t-xl rounded-b-none min-h-[44px] flex items-center gap-2
                    ${isActive 
                      ? 'bg-[var(--color-accent)] text-[var(--color-button-text)] shadow-[0_4px_12px_rgba(0,0,0,0.08)]' 
                      : 'bg-transparent text-[var(--color-secondary)] hover:text-[var(--color-heading)]'}
                  `}
                >
                  <IconComponent size={16} className="sm:w-[18px] sm:h-[18px]" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>

        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-md border border-white/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)]">Account Information</h2>
              <button
                onClick={() => handleSave()}
                disabled={saveStatus === 'saving'}
                className="w-full sm:w-auto px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent)]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
              >
                <CheckSquare size={16} className="flex-shrink-0" />
                {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent min-h-[44px] text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent min-h-[44px] text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleProfileUpdate('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent min-h-[44px] text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent min-h-[44px] text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={profile.role}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 min-h-[44px] text-sm sm:text-base"
                />
                <p className="text-xs text-gray-500 mt-1">Contact admin to change role</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={profile.department}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 min-h-[44px] text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Join Date
                  </label>
                  <input
                    type="text"
                    value={new Date(profile.joinDate).toLocaleDateString()}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 min-h-[44px] text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Account Status
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">Active</span>
                    <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            {saveStatus === 'saved' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm sm:text-base">
                <CheckSquare size={16} className="flex-shrink-0" />
                Profile updated successfully!
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl shadow-md border border-white/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)]">Notification Preferences</h2>
              <button
                onClick={() => handleSave()}
                disabled={saveStatus === 'saving'}
                className="w-full sm:w-auto px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent)]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
              >
                <CheckSquare size={16} className="flex-shrink-0" />
                {saveStatus === 'saving' ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>

            {/* Activity Notifications */}
            <div className="mb-8">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                Activity Notifications
              </h3>
              <div className="space-y-4">
              <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">New Orders</h4>
                  <p className="text-xs sm:text-sm text-gray-600">Get notified when new orders are received</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={notifications.newOrders}
                    onChange={() => handleNotificationToggle('newOrders')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">Ticket Updates</h4>
                  <p className="text-xs sm:text-sm text-gray-600">Get notified when tickets are updated or resolved</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={notifications.ticketUpdates}
                    onChange={() => handleNotificationToggle('ticketUpdates')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">System Alerts</h4>
                  <p className="text-xs sm:text-sm text-gray-600">Important system notifications and alerts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={notifications.systemAlerts}
                    onChange={() => handleNotificationToggle('systemAlerts')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">Weekly Reports</h4>
                  <p className="text-xs sm:text-sm text-gray-600">Receive weekly performance and analytics reports</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={notifications.weeklyReports}
                    onChange={() => handleNotificationToggle('weeklyReports')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

            {/* Delivery Methods */}
            <div className="mb-8">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                Delivery Methods
              </h3>
              <div className="space-y-4">
                <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">Email Notifications</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={() => handleNotificationToggle('emailNotifications')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">SMS Notifications</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Receive notifications via SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={notifications.smsNotifications}
                      onChange={() => handleNotificationToggle('smsNotifications')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">Push Notifications</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Receive browser push notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={notifications.pushNotifications}
                      onChange={() => handleNotificationToggle('pushNotifications')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {saveStatus === 'saved' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm sm:text-base">
                <CheckSquare size={16} className="flex-shrink-0" />
                Notification preferences saved successfully!
              </div>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white rounded-xl shadow-md border border-white/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)]">Security Settings</h2>
              <button
                onClick={() => handleSave()}
                disabled={saveStatus === 'saving' || !security.currentPassword || !security.newPassword || security.newPassword !== security.confirmPassword}
                className="w-full sm:w-auto px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent)]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
              >
                <CheckSquare size={16} className="flex-shrink-0" />
                {saveStatus === 'saving' ? 'Updating...' : 'Update Password'}
              </button>
            </div>

            <div className="max-w-full sm:max-w-md">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                Change Password
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Current Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={security.currentPassword}
                      onChange={(e) => handleSecurityUpdate('currentPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent min-h-[44px] text-sm sm:text-base"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 min-w-[24px] min-h-[24px] flex items-center justify-center"
                    >
                      {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={security.newPassword}
                      onChange={(e) => handleSecurityUpdate('newPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent min-h-[44px] text-sm sm:text-base"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 min-w-[24px] min-h-[24px] flex items-center justify-center"
                    >
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={security.confirmPassword}
                      onChange={(e) => handleSecurityUpdate('confirmPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent min-h-[44px] text-sm sm:text-base"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 min-w-[24px] min-h-[24px] flex items-center justify-center"
                    >
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {security.newPassword && security.confirmPassword && security.newPassword !== security.confirmPassword && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs sm:text-sm">
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  Passwords do not match
                </div>
              )}

              <div className="mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Password Requirements:</h4>
                <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <li>• At least 8 characters long</li>
                  <li>• Include uppercase and lowercase letters</li>
                  <li>• Include at least one number</li>
                  <li>• Include at least one special character</li>
                </ul>
              </div>
            </div>

            {saveStatus === 'saved' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm sm:text-base">
                <CheckSquare size={16} className="flex-shrink-0" />
                Password updated successfully!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
