import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function HomePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div style={{ 
      background: '#000', 
      color: '#e5e5e5', 
      fontFamily: 'Menlo, Monaco, monospace',
      minHeight: '100vh',
      padding: '40px'
    }}>
      <h1 style={{ color: '#f97316' }}>// ENGAGEDLOOP //</h1>
      <p>Supabase Connected: {user ? '✓ YES' : '✗ NO'}</p>
      {user && (
        <div>
          <p>User: {user.email}</p>
          <p>ID: {user.id}</p>
        </div>
      )}
      
      <div style={{ marginTop: '40px', border: '1px solid #222', padding: '20px' }}>
        <h3 style={{ color: '#f97316' }}>// AUTH_STATUS</h3>
        <p>{user ? 'Logged in as: ' + user.email : 'Not logged in'}</p>
      </div>

      <div style={{ marginTop: '20px', border: '1px solid #222', padding: '20px' }}>
        <h3 style={{ color: '#f97316' }}>// SUPABASE_CONFIG</h3>
        <p>Project: ioyqxwmgfdqzokwqpgdv</p>
        <p>URL: https://ioyqxwmgfdqzokwqpgdv.supabase.co</p>
      </div>
    </div>
  )
}
