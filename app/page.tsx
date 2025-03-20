"use client"

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Dashboard } from "../components/dashboard"

export default function Home() {
  const searchParams = useSearchParams()
  const test = searchParams.get('test')
  
  useEffect(() => {
    // Load comprehensive test script if test=comprehensive is in the URL
    if (test === 'comprehensive') {
      const script = document.createElement('script')
      script.src = '/comprehensive-test.js'
      script.async = true
      document.body.appendChild(script)
      
      return () => {
        document.body.removeChild(script)
      }
    }
  }, [test])
  
  return <Dashboard />
}
