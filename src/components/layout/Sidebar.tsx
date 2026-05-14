'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/src/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/session/new', label: 'New Session', icon: MicIcon },
  { href: '/history', label: 'My History', icon: ChartIcon },
]

const managerItems = [
  { href: '/manager', label: 'Team Overview', icon: UsersIcon },
  { href: '/manager/assignments', label: 'Assignments', icon: ClipboardIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-lg font-bold tracking-tight">Sales Coach</h1>
        <p className="text-xs text-gray-400 mt-0.5">IIA Training Platform</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Practice</p>
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href} />
        ))}

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2 mt-6">Manager</p>
        {managerItems.map((item) => (
          <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
        ))}
      </nav>
    </aside>
  )
}

function NavLink({ href, label, icon: Icon, active }: {
  href: string
  label: string
  icon: React.FC<{ className?: string }>
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
        active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}
