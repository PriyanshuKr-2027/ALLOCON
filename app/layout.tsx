import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChatBot RBAC - Project Management',
  description: 'Company Internal Chatbot with Role-Based Access Control',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark-bg text-white">{children}</body>
    </html>
  )
}
