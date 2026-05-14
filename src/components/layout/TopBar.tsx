'use client'

import { UserButton } from '@clerk/nextjs'

interface TopBarProps {
  title?: string
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {title && <h2 className="text-sm font-semibold text-gray-700">{title}</h2>}
      <div className="ml-auto">
        <UserButton />
      </div>
    </header>
  )
}
