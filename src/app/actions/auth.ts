'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get('email') as string
  if (!email) {
    return { error: 'E-Mail-Adresse ist erforderlich.' }
  }

  const supabase = await createClient()
  const origin = (await headers()).get('origin') || 'http://localhost:3000'

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('Magic link error:', error)
    return { error: 'Fehler beim Senden des Magic Links. Bitte überprüfe deine E-Mail.' }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
