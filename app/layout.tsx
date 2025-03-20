import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Klaviyo Analytics Dashboard',
  description: 'A comprehensive analytics dashboard for Klaviyo marketing data',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body>
        {children}
      </body>
    </html>
  )
}
