import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { CustomDropdown } from '../../../components'

type TabKey = 'accounts' | 'ops' | 'vendors' | 'matrix'
type UserRole = 'Admin' | 'Accounts' | 'Ops'
type UserStatus = 'Active' | 'Inactive'
type VendorStatus = 'Approved' | 'Pending'

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
  name: string
  gstOrPan: string
  status: VendorStatus
  slaScore: number
}

type Permission = 'Orders' | 'Vendors' | 'Accounts' | 'Ops'
type MatrixRole = 'Admin' | 'Accounts' | 'Ops' | 'Vendor'

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function generatePassword(): string {
  const base = Math.random().toString(36).slice(2, 8)
  const num = Math.floor(100 + Math.random() * 900)
  return `${base}${num}!`
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-white rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: color }}
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
  const [activeTab, setActiveTab] = useState<TabKey>('accounts')

  const tabs = useMemo(
    () => [
      { key: 'accounts' as const, label: 'Accounts Team' },
      { key: 'ops' as const, label: 'Ops Team' },
      { key: 'vendors' as const, label: 'Vendors' },
      { key: 'matrix' as const, label: 'Role Matrix' }
    ],
    []
  )

  // Accounts and Ops users
  const [accountsUsers, setAccountsUsers] = useState<UserRow[]>([
    { id: generateId('acct'), name: 'Aisha Verma', email: 'aisha@kyari.com', role: 'Accounts', status: 'Active', createdAt: new Date().toLocaleDateString() },
    { id: generateId('acct'), name: 'Rohit Shah', email: 'rohit@kyari.com', role: 'Admin', status: 'Active', createdAt: new Date().toLocaleDateString() }
  ])
  const [opsUsers, setOpsUsers] = useState<UserRow[]>([
    { id: generateId('ops'), name: 'Meera Iyer', email: 'meera@kyari.com', role: 'Ops', status: 'Active', createdAt: new Date().toLocaleDateString() },
    { id: generateId('ops'), name: 'Vikram Rao', email: 'vikram@kyari.com', role: 'Admin', status: 'Inactive', createdAt: new Date().toLocaleDateString() }
  ])

  // Vendors
  const [vendors, setVendors] = useState<VendorRow[]>([
    { id: generateId('v'), name: 'GreenLeaf Supplies', gstOrPan: '27ABCDE1234F1Z5', status: 'Pending', slaScore: 92 },
    { id: generateId('v'), name: 'Flora Logistics', gstOrPan: 'AAAPL1234C', status: 'Approved', slaScore: 88 }
  ])

  // Modals
  const [showUserModal, setShowUserModal] = useState(false)
  const [userForm, setUserForm] = useState<{ name: string; email: string; role: UserRole; status: UserStatus }>({ name: '', email: '', role: 'Accounts', status: 'Active' })
  const isAccountsTab = activeTab === 'accounts'

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
        source: 'accounts' | 'ops'
      }
    | null
  >(null)

  function openCreateUserModal() {
    const defaultRole: UserRole = isAccountsTab ? 'Accounts' : 'Ops'
    setUserForm({ name: '', email: '', role: defaultRole, status: 'Active' })
    setShowUserModal(true)
  }

  function handleCreateUserSubmit(e: React.FormEvent) {
    e.preventDefault()
    const created: UserRow = {
      id: generateId('usr'),
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      status: userForm.status,
      createdAt: new Date().toLocaleDateString()
    }
    
    // Add user to appropriate array based on role
    if (userForm.role === 'Accounts') {
      setAccountsUsers((rows) => [created, ...rows])
    } else if (userForm.role === 'Ops') {
      setOpsUsers((rows) => [created, ...rows])
    } else if (userForm.role === 'Admin') {
      // Admin users appear in both tabs
      setAccountsUsers((rows) => [created, ...rows])
      setOpsUsers((rows) => [created, ...rows])
    }
    
    const pwd = generatePassword()
    setShowUserModal(false)
    window.alert(`User created. Temporary password (shown once): ${pwd}`)
  }

  function handleDeactivateUser(id: string, table: 'accounts' | 'ops') {
    const mutate = (rows: UserRow[]) =>
      rows.map((r) => {
        if (r.id !== id) return r
        const nextStatus: UserStatus = r.status === 'Active' ? 'Inactive' : 'Active'
        return { ...r, status: nextStatus }
      })
    
    // Find the user to check if they're an Admin
    const userToUpdate = table === 'accounts' 
      ? accountsUsers.find(u => u.id === id)
      : opsUsers.find(u => u.id === id)
    
    if (userToUpdate?.role === 'Admin') {
      // Admin users appear in both tabs, so update both
      setAccountsUsers((rows) => mutate(rows))
      setOpsUsers((rows) => mutate(rows))
    } else {
      // Regular users only appear in their respective tab
      if (table === 'accounts') setAccountsUsers((rows) => mutate(rows))
      else setOpsUsers((rows) => mutate(rows))
    }
  }

  function openEditUserModal(row: UserRow, source: 'accounts' | 'ops') {
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
      setAccountsUsers((rows) => upsert(rows, updated))
      setOpsUsers((rows) => upsert(rows, updated))
    } else if (updated.role === 'Accounts') {
      setAccountsUsers((rows) => upsert(rows, updated))
      setOpsUsers((rows) => removeById(rows, updated.id))
    } else if (updated.role === 'Ops') {
      setOpsUsers((rows) => upsert(rows, updated))
      setAccountsUsers((rows) => removeById(rows, updated.id))
    }

    // If previous role was Admin and now not Admin, removal from the other list handled above
    // Close modal
    setShowEditModal(false)
    setEditForm(null)
  }

  // Vendors actions
  const [showKycModal, setShowKycModal] = useState<{ open: boolean; vendorName: string }>({ open: false, vendorName: '' })
  function approveVendor(id: string) {
    setVendors((rows) => rows.map((r) => (r.id === id ? { ...r, status: 'Approved' } : r)))
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
    <div className="p-4 sm:p-6 font-sans text-primary">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="font-heading text-secondary text-2xl sm:text-3xl lg:text-4xl font-semibold">Users & Roles</h2>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto border-b border-gray-200 mb-4 sm:mb-6">
        <div className="flex gap-2 sm:gap-4 min-w-max">
          {tabs.map((t) => {
            const isActive = activeTab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`bg-transparent rounded-none px-3 sm:px-4 py-3 font-semibold outline-none whitespace-nowrap text-sm sm:text-base transition-colors ${
                  isActive 
                    ? 'text-secondary border-b-4 border-accent border-solid' 
                    : 'text-gray-700 border-b-4 border-transparent hover:text-secondary'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
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
                  <tr className="bg-white">
                    <th className="text-left p-3 font-heading text-secondary font-normal">Name</th>
                    <th className="text-left p-3 font-heading text-secondary font-normal">Email</th>
                    <th className="text-left p-3 font-heading text-secondary font-normal">Role</th>
                    <th className="text-left p-3 font-heading text-secondary font-normal">Status</th>
                    <th className="text-left p-3 font-heading text-secondary font-normal">Created Date</th>
                    <th className="text-left p-3 font-heading text-secondary font-normal">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accountsUsers.map((row, idx) => (
                    <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-header-bg'}>
                      <td className="p-3">{row.name}</td>
                      <td className="p-3">{row.email}</td>
                      <td className="p-3">{row.role}</td>
                      <td className="p-3">
                        {row.status === 'Active' ? (
                          <Badge label="Active" color="#10B981" />
                        ) : (
                          <Badge label="Inactive" color="#EF4444" />
                        )}
                      </td>
                      <td className="p-3">{row.createdAt}</td>
                      <td className="p-3 flex gap-2">
                        <SecondaryButton
                          onClick={() => openEditUserModal(row, 'accounts')}
                        >
                          Edit
                        </SecondaryButton>
                        <PrimaryButton
                          className={row.status === 'Active' ? 'bg-red-500' : 'bg-accent'}
                          onClick={() => handleDeactivateUser(row.id, 'accounts')}
                        >
                          {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </PrimaryButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {accountsUsers.map((row) => (
                <div key={row.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-secondary text-lg">{row.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{row.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
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
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <SecondaryButton
                      onClick={() => openEditUserModal(row, 'accounts')}
                      className="flex-1 justify-center text-sm"
                    >
                      Edit
                    </SecondaryButton>
                    <PrimaryButton
                      className={`flex-1 justify-center text-sm ${row.status === 'Active' ? 'bg-red-500' : 'bg-accent'}`}
                      onClick={() => handleDeactivateUser(row.id, 'accounts')}
                    >
                      {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </PrimaryButton>
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
                <SecondaryButton type="button" onClick={() => setShowUserModal(false)} className="w-full sm:w-auto justify-center">Cancel</SecondaryButton>
                <PrimaryButton type="submit" className="w-full sm:w-auto justify-center">Create User</PrimaryButton>
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
                  <tr className="bg-white">
                    <th className="text-left p-3 font-heading text-secondary font-normal">Name</th>
                    <th className="text-left p-3 font-heading text-secondary font-normal">Email</th>
                    <th className="text-left p-3 font-heading text-secondary font-normal">Role</th>
                    <th className="text-left p-3 font-heading text-secondary font-normal">Status</th>
                    <th className="text-left p-3 font-heading text-secondary font-normal">Created Date</th>
                    <th className="text-left p-3 font-heading text-secondary font-normal">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {opsUsers.map((row, idx) => (
                    <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-header-bg'}>
                      <td className="p-3">{row.name}</td>
                      <td className="p-3">{row.email}</td>
                      <td className="p-3">{row.role}</td>
                      <td className="p-3">
                        {row.status === 'Active' ? (
                          <Badge label="Active" color="#10B981" />
                        ) : (
                          <Badge label="Inactive" color="#EF4444" />
                        )}
                      </td>
                      <td className="p-3">{row.createdAt}</td>
                      <td className="p-3 flex gap-2">
                        <SecondaryButton onClick={() => openEditUserModal(row, 'ops')}>Edit</SecondaryButton>
                        <PrimaryButton
                          style={{ background: row.status === 'Active' ? '#EF4444' : 'var(--color-accent)' }}
                          onClick={() => handleDeactivateUser(row.id, 'ops')}
                        >
                          {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </PrimaryButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {opsUsers.map((row) => (
                <div key={row.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-secondary text-lg">{row.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{row.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
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
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <SecondaryButton
                      onClick={() => openEditUserModal(row, 'ops')}
                      className="flex-1 justify-center text-sm"
                    >
                      Edit
                    </SecondaryButton>
                    <PrimaryButton
                      style={{ background: row.status === 'Active' ? '#EF4444' : 'var(--color-accent)' }}
                      onClick={() => handleDeactivateUser(row.id, 'ops')}
                      className="flex-1 justify-center text-sm"
                    >
                      {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </PrimaryButton>
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
                  <SecondaryButton type="button" onClick={() => setShowUserModal(false)}>Cancel</SecondaryButton>
                  <PrimaryButton type="submit">Create User</PrimaryButton>
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
                  <tr className="bg-white">
                    <th className="text-left p-3 font-heading text-secondary font-normal">Vendor Name</th>
                    <th className="text-left p-3 font-heading text-secondary font-normal">GST/PAN</th>
                    <th className="text-left p-3 font-heading text-secondary font-normal">Status</th>
                    <th className="text-left p-3 font-heading text-secondary font-normal">SLA Score (%)</th>
                    <th className="text-left p-3 font-heading text-secondary font-normal">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((row, idx) => (
                    <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-header-bg'}>
                      <td className="p-3">{row.name}</td>
                      <td className="p-3">{row.gstOrPan}</td>
                      <td className="p-3">
                        {row.status === 'Approved' ? (
                          <Badge label="Approved" color="#16A34A" />
                        ) : (
                          <Badge label="Pending" color="#F59E0B" />
                        )}
                      </td>
                      <td className="p-3">{row.slaScore}%</td>
                      <td className="p-3 flex gap-2">
                        <PrimaryButton
                          disabled={row.status === 'Approved'}
                          className={row.status === 'Approved' ? 'bg-green-500 text-white cursor-not-allowed' : 'bg-accent text-button-text'}
                          onClick={() => approveVendor(row.id)}
                        >
                          {row.status === 'Approved' ? 'Approved' : 'Approve Vendor'}
                        </PrimaryButton>
                        <SecondaryButton onClick={() => setShowKycModal({ open: true, vendorName: row.name })}>View KYC Docs</SecondaryButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {vendors.map((row) => (
                <div key={row.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-secondary text-lg">{row.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{row.gstOrPan}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {row.status === 'Approved' ? (
                        <Badge label="Approved" color="#16A34A" />
                      ) : (
                        <Badge label="Pending" color="#F59E0B" />
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">SLA Score</span>
                      <span className="font-bold text-xl text-secondary">{row.slaScore}%</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <PrimaryButton
                      disabled={row.status === 'Approved'}
                      className={`w-full justify-center text-sm ${row.status === 'Approved' ? 'bg-green-500 text-white cursor-not-allowed' : 'bg-accent text-button-text'}`}
                      onClick={() => approveVendor(row.id)}
                    >
                      {row.status === 'Approved' ? 'Approved' : 'Approve Vendor'}
                    </PrimaryButton>
                    <SecondaryButton 
                      onClick={() => setShowKycModal({ open: true, vendorName: row.name })} 
                      className="w-full justify-center text-sm"
                    >
                      View KYC Docs
                    </SecondaryButton>
                  </div>
                </div>
              ))}
            </div>

            <Modal open={showKycModal.open} onClose={() => setShowKycModal({ open: false, vendorName: '' })} title={`KYC Documents - ${showKycModal.vendorName}`}>
              <div className="text-gray-700">Vendor KYC Documents Placeholder</div>
            </Modal>
          </div>
        )}

        {activeTab === 'matrix' && (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-header-bg rounded-xl overflow-hidden">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-white">
                    <th className="text-left p-3 font-heading text-secondary font-normal">Role</th>
                    {permissions.map((p) => (
                      <th key={p} className="text-left p-3 font-heading text-secondary font-normal">{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixRoles.map((role, idx) => (
                    <tr key={role} className={idx % 2 === 0 ? 'bg-white' : 'bg-header-bg'}>
                      <td className="p-3 font-semibold">{role}</td>
                      {permissions.map((perm) => (
                        <td key={perm} className="p-3">
                          <input
                            type="checkbox"
                            checked={roleMatrix[role][perm]}
                            onChange={() => togglePermission(role, perm)}
                            className="scale-125 origin-center"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {matrixRoles.map((role) => (
                <div key={role} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
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
    </div>
  )
}

