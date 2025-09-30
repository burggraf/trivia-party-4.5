import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Trivia Party',
  description: 'Real-time multi-user trivia application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
