import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Frameforge — See it. Understand it. Recreate it.',
  description: 'A cinematic image analysis and reverse-prompting workspace.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
