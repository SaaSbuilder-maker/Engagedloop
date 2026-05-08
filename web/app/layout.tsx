export const metadata = {
  title: 'ENGAGEDLOOP - Supabase Test',
  description: 'Test Supabase integration',
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
