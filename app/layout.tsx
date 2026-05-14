import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Sales Coach — IIA',
  description: 'Practice your sales pitch with an AI prospect and get structured feedback.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={geist.variable}>
        <body className="min-h-screen antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}
