import { Link, Outlet } from 'react-router-dom'

function AdminLayout() {
  return (
    <div className="grid min-h-screen grid-cols-[220px_1fr]">
      <aside className="border-r border-gray-200 p-4">
        <h2 className="mb-3 text-xl font-semibold">Admin</h2>
        <nav className="flex flex-col gap-2">
          <Link className="text-blue-600 hover:underline" to="/">Back to Landing</Link>
        </nav>
      </aside>
      <main className="p-4">
        <h3 className="mb-4 text-lg font-medium">Admin Dashboard</h3>
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout


