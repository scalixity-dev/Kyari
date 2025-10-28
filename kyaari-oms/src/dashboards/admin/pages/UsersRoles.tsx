import { useMemo, useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { CustomDropdown, ConfirmationModal } from '../../../components'
import { userApi, type User as ApiUser } from '../../../services/userApi'
import { vendorApi, type VendorListItem } from '../../../services/vendorApi'
import toast from 'react-hot-toast'
import { useAuth } from '../../../auth/AuthProvider'

type TabKey = 'admin' | 'accounts' | 'ops' | 'vendors' | 'matrix'
type UserRole = 'Admin' | 'Accounts' | 'Ops'
type UserStatus = 'Active' | 'Inactive'

type UserRow = {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
}

type VendorRow = {
  id: string
  userId: string
  name: string
  email: string
  contactPhone: string
  gstOrPan: string
  status: string
  verified: boolean
  slaScore: number
  createdAt: string
}

type Permission = 'Orders' | 'Vendors' | 'Accounts' | 'Ops'
type MatrixRole = 'Admin' | 'Accounts' | 'Ops' | 'Vendor'

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: color, color: '#fff' }}
    >
      {label}
    </span>
  )
}

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const baseClasses = "bg-accent text-button-text border border-transparent px-4 py-2.5 rounded-xl font-bold shadow-sm transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
  const combinedClasses = props.className ? `${baseClasses} ${props.className}` : baseClasses
  
  return (
    <button
      {...props}
      className={combinedClasses}
      onMouseEnter={props.onMouseEnter}
    />
  )
}

function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const baseClasses = "bg-gray-100 text-gray-900 border border-gray-300 px-4 py-2.5 rounded-xl font-bold transition-colors hover:bg-gray-200"
  const combinedClasses = props.className ? `${baseClasses} ${props.className}` : baseClasses
  
  return (
    <button
      {...props}
      className={combinedClasses}
    />
  )
}

function Modal({ open, onClose, title, children, showClose = true }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; showClose?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-[520px] rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-5 border-b border-gray-200">
          <h3 className="font-heading text-secondary text-lg sm:text-xl">{title}</h3>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
        {showClose && (
          <div className="p-4 sm:p-5 pt-0 flex justify-end">
            <SecondaryButton onClick={onClose} className="w-full sm:w-auto justify-center">Close</SecondaryButton>
          </div>
        )}
      </div>
    </div>
  )
}

export default function UsersRoles() {
  const [activeTab, setActiveTab] = useState<TabKey>('admin')
  const [loading, setLoading] = useState(false)
  const { user: currentUser } = useAuth()
  
  // Delete confirmation modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    userId: string
    userName: string
    table: 'admin' | 'accounts' | 'ops'
  }>({
    isOpen: false,
    userId: '',
    userName: '',
    table: 'admin'
  })

  const tabs = useMemo(
    () => [
      { key: 'admin' as const, label: 'Admin Team' },
      { key: 'accounts' as const, label: 'Accounts Team' },
      { key: 'ops' as const, label: 'Ops Team' },
      { key: 'vendors' as const, label: 'Vendors' },
      { key: 'matrix' as const, label: 'Role Matrix' }
    ],
    []
  )

  // Admin, Accounts and Ops users
  const [adminUsers, setAdminUsers] = useState<UserRow[]>([])
  const [accountsUsers, setAccountsUsers] = useState<UserRow[]>([])
  const [opsUsers, setOpsUsers] = useState<UserRow[]>([])

  // Vendors
  const [vendors, setVendors] = useState<VendorRow[]>([])

  // Load users on component mount
  useEffect(() => {
    loadUsers()
    loadVendors()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const [adminData, accountsData, opsData] = await Promise.all([
        userApi.getUsers({ role: 'ADMIN' }),
        userApi.getUsers({ role: 'ACCOUNTS' }),
        userApi.getUsers({ role: 'OPS' })
      ])
      
      setAdminUsers(mapApiUsersToRows(adminData.users))
      setAccountsUsers(mapApiUsersToRows(accountsData.users))
      setOpsUsers(mapApiUsersToRows(opsData.users))
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const loadVendors = async () => {
    setLoading(true)
    try {
      const vendorData = await vendorApi.getVendors()
      setVendors(mapVendorApiToRows(vendorData.vendors))
    } catch (error) {
      console.error('Failed to load vendors:', error)
      toast.error('Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  const mapVendorApiToRows = (vendors: VendorListItem[]): VendorRow[] => {
    return vendors.map(vendor => ({
      id: vendor.id,
      userId: vendor.userId,
      name: vendor.companyName || vendor.contactPersonName,
      email: vendor.email || '',
      contactPhone: vendor.contactPhone,
      gstOrPan: vendor.gstNumber || vendor.panNumber || 'N/A',
      status: vendor.status,
      verified: vendor.verified,
      slaScore: vendor.slaComplianceRate || 0,
      createdAt: new Date(vendor.createdAt).toLocaleDateString()
    }))
  }

  const mapApiUsersToRows = (users: ApiUser[]): UserRow[] => {
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: mapRoleFromApi(user.roles[0] || 'ACCOUNTS'),
      status: user.status === 'ACTIVE' ? 'Active' : 'Inactive',
      createdAt: new Date(user.createdAt).toLocaleDateString()
    }))
  }

  const mapRoleFromApi = (apiRole: string): UserRole => {
    if (apiRole === 'ADMIN') return 'Admin'
    if (apiRole === 'OPS') return 'Ops'
    return 'Accounts'
  }

  const mapRoleToApi = (role: UserRole): 'ADMIN' | 'ACCOUNTS' | 'OPS' => {
    if (role === 'Admin') return 'ADMIN'
    if (role === 'Ops') return 'OPS'
    return 'ACCOUNTS'
  }

  // Modals
  const [showUserModal, setShowUserModal] = useState(false)
  const [userForm, setUserForm] = useState<{ name: string; email: string; role: UserRole; status: UserStatus }>({ name: '', email: '', role: 'Admin', status: 'Active' })
  const isAccountsTab = activeTab === 'accounts'
  const isOpsTab = activeTab === 'ops'

  // Edit User modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState<
    | {
        id: string
        name: string
        email: string
        role: UserRole
        status: UserStatus
        createdAt: string
        source: 'admin' | 'accounts' | 'ops'
      }
    | null
  >(null)

  function openCreateUserModal() {
    let defaultRole: UserRole = 'Admin'
    if (isAccountsTab) defaultRole = 'Accounts'
    else if (isOpsTab) defaultRole = 'Ops'
    
    setUserForm({ name: '', email: '', role: defaultRole, status: 'Active' })
    setShowUserModal(true)
  }

  async function handleCreateUserSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    try {
      const newUser = await userApi.createUser({
        name: userForm.name,
        email: userForm.email,
        role: mapRoleToApi(userForm.role),
        status: userForm.status === 'Active' ? 'ACTIVE' : 'INACTIVE'
      })

      const created: UserRow = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: userForm.role,
        status: userForm.status,
        createdAt: new Date(newUser.createdAt).toLocaleDateString()
      }
      
      // Add user to appropriate array based on role
      if (userForm.role === 'Admin') {
        setAdminUsers((rows) => [created, ...rows])
      } else if (userForm.role === 'Accounts') {
        setAccountsUsers((rows) => [created, ...rows])
      } else if (userForm.role === 'Ops') {
        setOpsUsers((rows) => [created, ...rows])
      }
      
      setShowUserModal(false)
      toast.success('User created successfully! Login credentials have been sent to their email.')
    } catch (error) {
      console.error('Failed to create user:', error)
      toast.error('Failed to create user. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivateUser(id: string, table: 'admin' | 'accounts' | 'ops') {
    const mutate = (rows: UserRow[]) =>
      rows.map((r) => {
        if (r.id !== id) return r
        const nextStatus: UserStatus = r.status === 'Active' ? 'Inactive' : 'Active'
        return { ...r, status: nextStatus }
      })
    
    // Find the user
    let userToUpdate: UserRow | undefined
    if (table === 'admin') userToUpdate = adminUsers.find(u => u.id === id)
    else if (table === 'accounts') userToUpdate = accountsUsers.find(u => u.id === id)
    else userToUpdate = opsUsers.find(u => u.id === id)
    
    if (!userToUpdate) return

    const newStatus = userToUpdate.status === 'Active' ? 'INACTIVE' : 'ACTIVE'
    
    try {
      setLoading(true)
      await userApi.toggleUserStatus(id, newStatus)
      
      // Update the appropriate list
      if (table === 'admin') setAdminUsers((rows) => mutate(rows))
      else if (table === 'accounts') setAccountsUsers((rows) => mutate(rows))
      else setOpsUsers((rows) => mutate(rows))
      
      toast.success(`User ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Failed to toggle user status:', error)
      toast.error('Failed to update user status')
    } finally {
      setLoading(false)
    }
  }

  function openDeleteConfirmation(id: string, table: 'admin' | 'accounts' | 'ops', userName: string) {
    setDeleteConfirmation({
      isOpen: true,
      userId: id,
      userName,
      table
    })
  }

  async function handleConfirmDelete() {
    const { userId, table } = deleteConfirmation
    
    try {
      setLoading(true)
      await userApi.deleteUser(userId)
      
      // Remove from appropriate list
      if (table === 'admin') {
        setAdminUsers((rows) => rows.filter((r) => r.id !== userId))
      } else if (table === 'accounts') {
        setAccountsUsers((rows) => rows.filter((r) => r.id !== userId))
      } else {
        setOpsUsers((rows) => rows.filter((r) => r.id !== userId))
      }
      
      toast.success('User deleted successfully')
      setDeleteConfirmation({ isOpen: false, userId: '', userName: '', table: 'admin' })
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast.error('Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  function openEditUserModal(row: UserRow, source: 'admin' | 'accounts' | 'ops') {
    setEditForm({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.createdAt,
      source
    })
    setShowEditModal(true)
  }

  function handleEditUserSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm) return

    const updated: UserRow = {
      id: editForm.id,
      name: editForm.name,
      email: editForm.email,
      role: editForm.role,
      status: editForm.status,
      createdAt: editForm.createdAt
    }

    // Determine previous role if needed in future; not used currently
    // const prevRoleCandidate = editForm.source === 'accounts'
    //   ? accountsUsers.find((u) => u.id === editForm.id)
    //   : opsUsers.find((u) => u.id === editForm.id)
    // const prevRole: UserRole = prevRoleCandidate ? prevRoleCandidate.role : editForm.role

    const upsert = (rows: UserRow[], user: UserRow): UserRow[] => {
      const exists = rows.some((r) => r.id === user.id)
      return exists ? rows.map((r) => (r.id === user.id ? user : r)) : [user, ...rows]
    }
    const removeById = (rows: UserRow[], id: string): UserRow[] => rows.filter((r) => r.id !== id)

    if (updated.role === 'Admin') {
      setAdminUsers((rows) => upsert(rows, updated))
      setAccountsUsers((rows) => removeById(rows, updated.id))
      setOpsUsers((rows) => removeById(rows, updated.id))
    } else if (updated.role === 'Accounts') {
      setAccountsUsers((rows) => upsert(rows, updated))
      setAdminUsers((rows) => removeById(rows, updated.id))
      setOpsUsers((rows) => removeById(rows, updated.id))
    } else if (updated.role === 'Ops') {
      setOpsUsers((rows) => upsert(rows, updated))
      setAdminUsers((rows) => removeById(rows, updated.id))
      setAccountsUsers((rows) => removeById(rows, updated.id))
    }

    // If previous role was Admin and now not Admin, removal from the other list handled above
    // Close modal
    setShowEditModal(false)
    setEditForm(null)
  }

  // Vendors actions
  const [showKycModal, setShowKycModal] = useState<{ open: boolean; vendorName: string; vendorData: VendorRow | null }>({ open: false, vendorName: '', vendorData: null })
  
  async function handleApproveVendor(userId: string, vendorName: string) {
    try {
      setLoading(true)
      await vendorApi.approveVendor(userId)
      
      // Update local state
      setVendors((rows) => rows.map((r) => 
        r.userId === userId ? { ...r, status: 'ACTIVE', verified: true } : r
      ))
      
      toast.success(`${vendorName} approved successfully`)
    } catch (error) {
      console.error('Failed to approve vendor:', error)
      toast.error('Failed to approve vendor')
    } finally {
      setLoading(false)
    }
  }

  async function handleSuspendVendor(userId: string, vendorName: string) {
    if (!window.confirm(`Are you sure you want to suspend ${vendorName}?`)) {
      return
    }

    try {
      setLoading(true)
      await vendorApi.suspendVendor(userId)
      
      // Update local state
      setVendors((rows) => rows.map((r) => 
        r.userId === userId ? { ...r, status: 'SUSPENDED' } : r
      ))
      
      toast.success(`${vendorName} suspended successfully`)
    } catch (error) {
      console.error('Failed to suspend vendor:', error)
      toast.error('Failed to suspend vendor')
    } finally {
      setLoading(false)
    }
  }

  function openKycModal(vendor: VendorRow) {
    setShowKycModal({ 
      open: true, 
      vendorName: vendor.name,
      vendorData: vendor
    })
  }

  // Role Matrix
  const permissions: Permission[] = ['Orders', 'Vendors', 'Accounts', 'Ops']
  const matrixRoles: MatrixRole[] = ['Admin', 'Accounts', 'Ops', 'Vendor']
  const [roleMatrix, setRoleMatrix] = useState<Record<MatrixRole, Record<Permission, boolean>>>(() => {
    const initial: Record<MatrixRole, Record<Permission, boolean>> = {
      Admin: { Orders: true, Vendors: true, Accounts: true, Ops: true },
      Accounts: { Orders: true, Vendors: false, Accounts: true, Ops: false },
      Ops: { Orders: true, Vendors: true, Accounts: false, Ops: true },
      Vendor: { Orders: true, Vendors: false, Accounts: false, Ops: false }
    }
    return initial
  })

  function togglePermission(role: MatrixRole, perm: Permission) {
    setRoleMatrix((prev) => ({
      ...prev,
      [role]: { ...prev[role], [perm]: !prev[role][perm] }
    }))
  }

  return (
    <div className="p-4 sm:p-10 font-sans text-primary min-h-[calc(100vh-4rem)] w-full" style={{ background: 'var(--color-sharktank-bg)' }}>
      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-heading mb-2">Users & Roles</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage system users, vendors, and permissions</p>
      </div>

      {/* Tabs */}
      <div className="mb-4 sm:mb-6 overflow-x-auto">
        <div className="relative min-w-max">
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--color-accent)] rounded-full opacity-80"></div>
          <div className="relative flex gap-2 sm:gap-4">
            {tabs.map((t) => {
              const isActive = activeTab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`
                    px-5 py-2.5 font-semibold outline-none whitespace-nowrap text-sm sm:text-base transition-all duration-200
                    rounded-t-xl rounded-b-none min-h-[44px]
                    ${isActive 
                      ? 'bg-[var(--color-accent)] text-[var(--color-button-text)] shadow-[0_4px_12px_rgba(0,0,0,0.08)]' 
                      : 'bg-transparent text-[var(--color-secondary)] hover:text-[var(--color-heading)]'}
                  `}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading users...</p>
        </div>
      ) : (
      <div>
        {activeTab === 'admin' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <div />
              <PrimaryButton onClick={openCreateUserModal} disabled={loading} className="w-full sm:w-auto justify-center sm:justify-start">
                <span className="inline-flex items-center gap-2"><Plus size={16} /> {loading ? 'Loading...' : 'Create New Admin'}</span>
              </PrimaryButton>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-header-bg rounded-xl overflow-hidden">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr style={{ background: 'var(--color-accent)' }}>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Name</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Email</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Role</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Status</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Created Date</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
                      <td className="p-3 font-semibold text-secondary">{row.name}</td>
                      <td className="p-3 text-sm">{row.email}</td>
                      <td className="p-3 text-sm">{row.role}</td>
                      <td className="p-3">
                        {row.status === 'Active' ? (
                          <Badge label="Active" color="#10B981" />
                        ) : (
                          <Badge label="Inactive" color="#EF4444" />
                        )}
                      </td>
                      <td className="p-3 text-sm">{row.createdAt}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditUserModal(row, 'admin')}
                          className="bg-blue-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          className={`rounded-md px-2.5 py-1.5 text-xs text-white transition-colors ${row.status === 'Active' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[var(--color-accent)] hover:brightness-95'}`}
                          onClick={() => handleDeactivateUser(row.id, 'admin')}
                        >
                          {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        {currentUser?.id !== row.id && (
                          <button
                            className="bg-red-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-red-600 transition-colors"
                            onClick={() => openDeleteConfirmation(row.id, 'admin', row.name)}
                          >
                            Delete
                          </button>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {adminUsers.map((row) => (
                <div key={row.id} className="rounded-xl p-4 border border-gray-200 bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-secondary text-lg">{row.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{row.email}</p>
                    </div>
                    <div>
                      {row.status === 'Active' ? (
                        <Badge label="Active" color="#10B981" />
                      ) : (
                        <Badge label="Inactive" color="#EF4444" />
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Role</span>
                      <span className="font-medium">{row.role}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Created Date</span>
                      <span className="font-medium">{row.createdAt}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openEditUserModal(row, 'admin')}
                      className="flex-1 bg-blue-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-blue-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      className={`flex-1 rounded-md px-2.5 py-1.5 text-xs text-white transition-colors ${row.status === 'Active' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[var(--color-accent)] hover:brightness-95'}`}
                      onClick={() => handleDeactivateUser(row.id, 'admin')}
                    >
                      {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                    {currentUser?.id !== row.id && (
                      <button
                        className="w-full bg-red-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-red-600 transition-colors"
                        onClick={() => openDeleteConfirmation(row.id, 'admin', row.name)}
                      >
                        Delete User
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Modal open={showUserModal} onClose={() => setShowUserModal(false)} title="Create New Admin" showClose={false}>
              <form onSubmit={handleCreateUserSubmit} className="grid gap-3">
                <div>
                  <label className="block font-semibold mb-1">Name</label>
                  <input
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Full name"
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    required
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="admin@kyari.com"
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Role</label>
                <CustomDropdown
                  required
                  value={userForm.role}
                  onChange={(value) => setUserForm((f) => ({ ...f, role: value as UserRole }))}
                  options={[
                    { value: 'Admin', label: 'Admin' }
                  ]}
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Status</label>
                <CustomDropdown
                  required
                  value={userForm.status}
                  onChange={(value) => setUserForm((f) => ({ ...f, status: value as UserStatus }))}
                  options={[
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' }
                  ]}
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <SecondaryButton type="button" onClick={() => setShowUserModal(false)} disabled={loading} className="w-full sm:w-auto justify-center">Cancel</SecondaryButton>
                <PrimaryButton type="submit" disabled={loading} className="w-full sm:w-auto justify-center">
                  {loading ? 'Creating...' : 'Create Admin'}
                </PrimaryButton>
              </div>
              </form>
            </Modal>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <div />
              <PrimaryButton onClick={openCreateUserModal} className="w-full sm:w-auto justify-center sm:justify-start">
                <span className="inline-flex items-center gap-2"><Plus size={16} /> Create New User</span>
              </PrimaryButton>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-header-bg rounded-xl overflow-hidden">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr style={{ background: 'var(--color-accent)' }}>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Name</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Email</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Role</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Status</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Created Date</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accountsUsers.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
                      <td className="p-3 font-semibold text-secondary">{row.name}</td>
                      <td className="p-3 text-sm">{row.email}</td>
                      <td className="p-3 text-sm">{row.role}</td>
                      <td className="p-3">
                        {row.status === 'Active' ? (
                          <Badge label="Active" color="#10B981" />
                        ) : (
                          <Badge label="Inactive" color="#EF4444" />
                        )}
                      </td>
                      <td className="p-3 text-sm">{row.createdAt}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditUserModal(row, 'accounts')}
                          className="bg-blue-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          className={`rounded-md px-2.5 py-1.5 text-xs text-white transition-colors ${row.status === 'Active' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[var(--color-accent)] hover:brightness-95'}`}
                          onClick={() => handleDeactivateUser(row.id, 'accounts')}
                        >
                          {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="bg-red-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-red-600 transition-colors"
                          onClick={() => openDeleteConfirmation(row.id, 'accounts', row.name)}
                        >
                          Delete
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {accountsUsers.map((row) => (
                <div key={row.id} className="rounded-xl p-4 border border-gray-200 bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-secondary text-lg">{row.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{row.email}</p>
                    </div>
                    <div>
                      {row.status === 'Active' ? (
                        <Badge label="Active" color="#10B981" />
                      ) : (
                        <Badge label="Inactive" color="#EF4444" />
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Role</span>
                      <span className="font-medium">{row.role}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Created Date</span>
                      <span className="font-medium">{row.createdAt}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openEditUserModal(row, 'accounts')}
                      className="flex-1 bg-blue-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-blue-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      className={`flex-1 rounded-md px-2.5 py-1.5 text-xs text-white transition-colors ${row.status === 'Active' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[var(--color-accent)] hover:brightness-95'}`}
                      onClick={() => handleDeactivateUser(row.id, 'accounts')}
                    >
                      {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="w-full bg-red-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-red-600 transition-colors"
                      onClick={() => openDeleteConfirmation(row.id, 'accounts', row.name)}
                    >
                      Delete User
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Modal open={showUserModal} onClose={() => setShowUserModal(false)} title="Create New User" showClose={false}>
              <form onSubmit={handleCreateUserSubmit} className="grid gap-3">
                <div>
                  <label className="block font-semibold mb-1">Name</label>
                  <input
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Full name"
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    required
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@kyari.com"
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Role</label>
                <CustomDropdown
                  required
                  value={userForm.role}
                  onChange={(value) => setUserForm((f) => ({ ...f, role: value as UserRole }))}
                  options={[
                    { value: 'Admin', label: 'Admin' },
                    { value: 'Accounts', label: 'Accounts' },
                    { value: 'Ops', label: 'Ops' }
                  ]}
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Status</label>
                <CustomDropdown
                  required
                  value={userForm.status}
                  onChange={(value) => setUserForm((f) => ({ ...f, status: value as UserStatus }))}
                  options={[
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' }
                  ]}
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <SecondaryButton type="button" onClick={() => setShowUserModal(false)} disabled={loading} className="w-full sm:w-auto justify-center">Cancel</SecondaryButton>
                <PrimaryButton type="submit" disabled={loading} className="w-full sm:w-auto justify-center">
                  {loading ? 'Creating...' : 'Create User'}
                </PrimaryButton>
              </div>
              </form>
            </Modal>
          </div>
        )}

        {activeTab === 'ops' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <div />
              <PrimaryButton onClick={openCreateUserModal} className="w-full sm:w-auto justify-center sm:justify-start">
                <span className="inline-flex items-center gap-2"><Plus size={16} /> Create New User</span>
              </PrimaryButton>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-header-bg rounded-xl overflow-hidden">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr style={{ background: 'var(--color-accent)' }}>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Name</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Email</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Role</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Status</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Created Date</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {opsUsers.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
                      <td className="p-3 font-semibold text-secondary">{row.name}</td>
                      <td className="p-3 text-sm">{row.email}</td>
                      <td className="p-3 text-sm">{row.role}</td>
                      <td className="p-3">
                        {row.status === 'Active' ? (
                          <Badge label="Active" color="#10B981" />
                        ) : (
                          <Badge label="Inactive" color="#EF4444" />
                        )}
                      </td>
                      <td className="p-3 text-sm">{row.createdAt}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditUserModal(row, 'ops')}
                          className="bg-blue-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          className={`rounded-md px-2.5 py-1.5 text-xs text-white transition-colors ${row.status === 'Active' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[var(--color-accent)] hover:brightness-95'}`}
                          onClick={() => handleDeactivateUser(row.id, 'ops')}
                        >
                          {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="bg-red-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-red-600 transition-colors"
                          onClick={() => openDeleteConfirmation(row.id, 'ops', row.name)}
                        >
                          Delete
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {opsUsers.map((row) => (
                <div key={row.id} className="rounded-xl p-4 border border-gray-200 bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-secondary text-lg">{row.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{row.email}</p>
                    </div>
                    <div>
                      {row.status === 'Active' ? (
                        <Badge label="Active" color="#10B981" />
                      ) : (
                        <Badge label="Inactive" color="#EF4444" />
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Role</span>
                      <span className="font-medium">{row.role}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Created Date</span>
                      <span className="font-medium">{row.createdAt}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openEditUserModal(row, 'ops')}
                      className="flex-1 bg-blue-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-blue-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      className={`flex-1 rounded-md px-2.5 py-1.5 text-xs text-white transition-colors ${row.status === 'Active' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[var(--color-accent)] hover:brightness-95'}`}
                      onClick={() => handleDeactivateUser(row.id, 'ops')}
                    >
                      {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="w-full bg-red-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-red-600 transition-colors"
                      onClick={() => openDeleteConfirmation(row.id, 'ops', row.name)}
                    >
                      Delete User
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Modal open={showUserModal} onClose={() => setShowUserModal(false)} title="Create New User" showClose={false}>
              <form onSubmit={handleCreateUserSubmit} className="grid gap-3">
                <div>
                  <label className="block font-semibold mb-1">Name</label>
                  <input
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Full name"
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    required
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="name@kyari.com"
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Role</label>
                  <CustomDropdown
                    required
                    value={userForm.role}
                    onChange={(value) => setUserForm((f) => ({ ...f, role: value as UserRole }))}
                    options={[
                      { value: 'Admin', label: 'Admin' },
                      { value: 'Accounts', label: 'Accounts' },
                      { value: 'Ops', label: 'Ops' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <CustomDropdown
                    required
                    value={userForm.status}
                    onChange={(value) => setUserForm((f) => ({ ...f, status: value as UserStatus }))}
                    options={[
                      { value: 'Active', label: 'Active' },
                      { value: 'Inactive', label: 'Inactive' }
                    ]}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <SecondaryButton type="button" onClick={() => setShowUserModal(false)} disabled={loading}>Cancel</SecondaryButton>
                  <PrimaryButton type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create User'}</PrimaryButton>
                </div>
              </form>
            </Modal>
          </div>
        )}

        {activeTab === 'vendors' && (
          <div>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-header-bg rounded-xl overflow-hidden">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr style={{ background: 'var(--color-accent)' }}>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Company Name</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Email</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Phone</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>GST/PAN</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Status</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>SLA Score</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((row) => {
                    const isApproved = row.status === 'ACTIVE' && row.verified
                    const isPending = row.status === 'PENDING' || !row.verified
                    const isSuspended = row.status === 'SUSPENDED'
                    
                    return (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
                        <td className="p-3 font-semibold text-secondary">{row.name}</td>
                        <td className="p-3 text-sm">{row.email}</td>
                        <td className="p-3 text-sm">{row.contactPhone}</td>
                        <td className="p-3 text-sm">{row.gstOrPan}</td>
                        <td className="p-3">
                          {isApproved ? (
                            <Badge label="Approved" color="#16A34A" />
                          ) : isSuspended ? (
                            <Badge label="Suspended" color="#DC2626" />
                          ) : (
                            <Badge label="Pending" color="#F59E0B" />
                          )}
                        </td>
                        <td className="p-3 text-sm font-medium">{row.slaScore}%</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => handleApproveVendor(row.userId, row.name)}
                              className="bg-green-600 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-green-700 transition-colors"
                              disabled={loading}
                            >
                              Approve
                            </button>
                          )}
                          {isApproved && (
                            <button
                              onClick={() => handleSuspendVendor(row.userId, row.name)}
                              className="bg-orange-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-orange-600 transition-colors"
                              disabled={loading}
                            >
                              Suspend
                            </button>
                          )}
                          <button
                            onClick={() => openKycModal(row)}
                            className="bg-gray-100 text-gray-900 border border-gray-300 rounded-md px-2.5 py-1.5 text-xs hover:bg-gray-200 transition-colors"
                          >
                            View Details
                          </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {vendors.map((row) => {
                const isApproved = row.status === 'ACTIVE' && row.verified
                const isPending = row.status === 'PENDING' || !row.verified
                const isSuspended = row.status === 'SUSPENDED'

                return (
                  <div key={row.id} className="rounded-xl p-4 border border-gray-200 bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-secondary text-lg">{row.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{row.email}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{row.contactPhone}</p>
                      </div>
                      <div>
                        {isApproved ? (
                          <Badge label="Approved" color="#16A34A" />
                        ) : isSuspended ? (
                          <Badge label="Suspended" color="#DC2626" />
                        ) : (
                          <Badge label="Pending" color="#F59E0B" />
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500 block">GST/PAN</span>
                        <span className="font-medium text-xs">{row.gstOrPan}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">SLA Score</span>
                        <span className="font-bold text-lg text-secondary">{row.slaScore}%</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {isPending && (
                        <button
                          onClick={() => handleApproveVendor(row.userId, row.name)}
                          className="flex-1 bg-green-600 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-green-700 transition-colors"
                          disabled={loading}
                        >
                          Approve Vendor
                        </button>
                      )}
                      {isApproved && (
                        <button
                          onClick={() => handleSuspendVendor(row.userId, row.name)}
                          className="flex-1 bg-orange-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-orange-600 transition-colors"
                          disabled={loading}
                        >
                          Suspend Vendor
                        </button>
                      )}
                      <button 
                        onClick={() => openKycModal(row)} 
                        className="flex-1 bg-gray-100 text-gray-900 border border-gray-300 rounded-md px-2.5 py-1.5 text-xs hover:bg-gray-200 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <Modal 
              open={showKycModal.open} 
              onClose={() => setShowKycModal({ open: false, vendorName: '', vendorData: null })} 
              title={`Vendor Details - ${showKycModal.vendorName}`}
            >
              {showKycModal.vendorData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Company Name</label>
                      <p className="text-gray-900">{showKycModal.vendorData.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Email</label>
                      <p className="text-gray-900 text-sm">{showKycModal.vendorData.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Contact Phone</label>
                      <p className="text-gray-900">{showKycModal.vendorData.contactPhone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500">GST/PAN</label>
                      <p className="text-gray-900 text-sm">{showKycModal.vendorData.gstOrPan}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Status</label>
                      <p className="text-gray-900">
                        {showKycModal.vendorData.status === 'ACTIVE' && showKycModal.vendorData.verified ? 'Approved' : 
                         showKycModal.vendorData.status === 'SUSPENDED' ? 'Suspended' : 'Pending Approval'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-500">SLA Score</label>
                      <p className="text-gray-900 font-bold text-lg">{showKycModal.vendorData.slaScore}%</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-semibold text-gray-500">Created Date</label>
                      <p className="text-gray-900">{showKycModal.vendorData.createdAt}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 italic">KYC documents and full vendor profile details will be available in a future update.</p>
                  </div>
                </div>
              )}
            </Modal>
          </div>
        )}

        {activeTab === 'matrix' && (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-header-bg rounded-xl overflow-hidden">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr style={{ background: 'var(--color-accent)' }}>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Role</th>
                    {permissions.map((p) => (
                      <th key={p} className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixRoles.map((role) => (
                    <tr key={role} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
                      <td className="p-3 font-semibold text-secondary">{role}</td>
                      {permissions.map((perm) => (
                        <td key={perm} className="p-3">
                          <input
                            type="checkbox"
                            checked={roleMatrix[role][perm]}
                            onChange={() => togglePermission(role, perm)}
                            className="scale-125 origin-center cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {matrixRoles.map((role) => (
                <div key={role} className="rounded-xl p-4 border border-gray-200 bg-white">
                  <h3 className="font-semibold text-secondary text-lg mb-4">{role}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {permissions.map((perm) => (
                      <div key={perm} className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">{perm}</label>
                        <input
                          type="checkbox"
                          checked={roleMatrix[role][perm]}
                          onChange={() => togglePermission(role, perm)}
                          className="scale-125 origin-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteConfirmation.isOpen}
          onClose={() => setDeleteConfirmation({ isOpen: false, userId: '', userName: '', table: 'admin' })}
          onConfirm={handleConfirmDelete}
          title="Delete User"
          message={`Are you sure you want to permanently delete ${deleteConfirmation.userName}? This action cannot be undone and will remove all their data from the system.`}
          confirmText="Delete User"
          cancelText="Cancel"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
          isLoading={loading}
        />

        {/* Edit User Modal */}
        <Modal
          open={showEditModal && !!editForm}
          onClose={() => {
            setShowEditModal(false)
            setEditForm(null)
          }}
          title={editForm ? `Edit User - ${editForm.name}` : 'Edit User'}
          showClose={false}
        >
          {editForm && (
            <form onSubmit={handleEditUserSubmit} className="grid gap-4">
              <div>
                <label className="block font-semibold mb-2 text-sm">Name</label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => (f ? { ...f, name: e.target.value } : f))}
                  placeholder="Full name"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2 text-sm">Email</label>
                <input
                  required
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => (f ? { ...f, email: e.target.value } : f))}
                  placeholder="name@kyari.com"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2 text-sm">Role</label>
                <CustomDropdown
                  required
                  value={editForm.role}
                  onChange={(value) =>
                    setEditForm((f) => (f ? { ...f, role: value as UserRole } : f))
                  }
                  options={[
                    { value: 'Admin', label: 'Admin' },
                    { value: 'Accounts', label: 'Accounts' },
                    { value: 'Ops', label: 'Ops' }
                  ]}
                  className="p-3"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2 text-sm">Status</label>
                <CustomDropdown
                  required
                  value={editForm.status}
                  onChange={(value) =>
                    setEditForm((f) => (f ? { ...f, status: value as UserStatus } : f))
                  }
                  options={[
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' }
                  ]}
                  className="p-3"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditForm(null)
                  }}
                  className="w-full sm:w-auto justify-center"
                >
                  Cancel
                </SecondaryButton>
                <PrimaryButton type="submit" className="w-full sm:w-auto justify-center">Save Changes</PrimaryButton>
              </div>
            </form>
          )}
        </Modal>
      </div>
      )}
    </div>
  )
}

