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
      <head>
        {process.env.NODE_ENV === 'development' && (
          <script src="/mock-data.js" type="module" />
        )}
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
