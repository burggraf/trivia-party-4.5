/**
 * Script to create a test host account for development
 * Run with: npx tsx scripts/create-test-host.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ewctldocenqnahrbdkpi.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3Y3RsZG9jZW5xbmFocmJka3BpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MjU3NjEsImV4cCI6MjA3NDIwMTc2MX0.2BV3kddomV3kolKxOypv2rNEGbzUWWilkv8aSdlBwkA'

async function createTestHost() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  console.log('Creating test host account...')
  console.log('Email: testhost@example.com')
  console.log('Password: testpass123')

  // Sign up the host
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'testhost@example.com',
    password: 'testpass123',
    options: {
      data: {
        display_name: 'Test Host',
        role: 'host',
      },
    },
  })

  if (signUpError) {
    console.error('Error creating auth user:', signUpError.message)
    return
  }

  if (!signUpData.user) {
    console.error('No user returned from signup')
    return
  }

  console.log('✓ Auth user created:', signUpData.user.id)

  // Create host record
  const { error: hostError } = await supabase.from('hosts').insert({
    id: signUpData.user.id,
    email: 'testhost@example.com',
    display_name: 'Test Host',
  })

  if (hostError) {
    if (hostError.message.includes('duplicate')) {
      console.log('✓ Host record already exists (created by trigger)')
    } else {
      console.error('Error creating host record:', hostError.message)
      return
    }
  } else {
    console.log('✓ Host record created')
  }

  console.log('\n✅ Test host account ready!')
  console.log('You can now login at http://localhost:5173/host/login')
  console.log('Email: testhost@example.com')
  console.log('Password: testpass123')
}

createTestHost().catch(console.error)