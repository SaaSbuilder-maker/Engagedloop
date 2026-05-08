'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)

  const supabase = createClient()

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Check your email for confirmation!')
      setUser(data.user)
    }
  }

  const handleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Signed in as: ' + data.user.email)
      setUser(data.user)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setMessage('Signed out')
  }

  return (
    <div style={{
      background: '#000',
      color: '#e5e5e5',
      fontFamily: 'Menlo, Monaco, monospace',
      minHeight: '100vh',
      padding: '40px',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#f97316', marginBottom: '30px' }}>// AUTH_MODULE</h1>
      
      {user ? (
        <div>
          <p style={{ color: '#22c55e' }}>✓ LOGGED IN</p>
          <p>Email: {user.email}</p>
          <p>ID: {user.id}</p>
          <button 
            onClick={handleSignOut}
            style={{
              background: '#000',
              border: '1px solid #f97316',
              color: '#f97316',
              padding: '10px 20px',
              marginTop: '20px',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            [SIGN_OUT]
          </button>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>// EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                background: '#111',
                border: '1px solid #222',
                color: '#e5e5e5',
                padding: '10px',
                fontFamily: 'inherit'
              }}
              placeholder="user@example.com"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>// PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                background: '#111',
                border: '1px solid #222',
                color: '#e5e5e5',
                padding: '10px',
                fontFamily: 'inherit'
              }}
              placeholder="••••••••"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleSignUp}
              style={{
                background: '#000',
                border: '1px solid #444',
                color: '#e5e5e5',
                padding: '10px 20px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              [SIGN_UP]
            </button>
            <button 
              onClick={handleSignIn}
              style={{
                background: '#000',
                border: '1px solid #f97316',
                color: '#f97316',
                padding: '10px 20px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              [SIGN_IN]
            </button>
          </div>
        </div>
      )}

      {message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          background: '#111', 
          border: '1px solid #222',
          color: message.includes('Error') ? '#ef4444' : '#22c55e'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: '40px', borderTop: '1px solid #222', paddingTop: '20px' }}>
        <p style={{ color: '#444', fontSize: '11px' }}>
          Project: ioyqxwmgfdqzokwqpgdv<br/>
          Supabase Connected ✓
        </p>
      </div>
    </div>
  )
}
