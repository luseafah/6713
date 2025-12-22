import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GlazeProtocol from '@/components/GlazeProtocol'
import ProtocolNotifications from '@/components/ProtocolNotifications'
import AuthGatekeeper from '@/components/AuthGatekeeper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '6713 - Sovereign Database',
  description: 'Social platform with verification, COMA, Self-Kill, and CPR systems',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthGatekeeper>
          <GlazeProtocol />
          <ProtocolNotifications />
          {children}
        </AuthGatekeeper>
      </body>
    </html>
  )
}
