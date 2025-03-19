"use client"

import { Dashboard } from "../components/dashboard"
import { ThemeProvider } from "../components/theme-provider"

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Dashboard />
    </ThemeProvider>
  )
}
