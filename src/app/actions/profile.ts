'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const fullName = formData.get('fullName') as string
  const iban = formData.get('iban') as string

  if (!fullName || !fullName.trim()) {
    return { error: 'Vollständiger Name ist erforderlich.' }
  }
  if (!iban || !iban.trim()) {
    return { error: 'IBAN ist erforderlich.' }
  }

  // Format IBAN (remove spaces, uppercase)
  const cleanIban = iban.replace(/\s+/g, '').toUpperCase()
  
  // Basic validation for CH and FL IBANs (or standard length check)
  if (cleanIban.length < 15) {
    return { error: 'Ungültiges IBAN-Format. Bitte überprüfe deine Eingabe.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Nicht authentifiziert.' }
  }

  // Update profiles table. 
  // RLS will allow users to edit their own profile.
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName.trim(),
      iban: cleanIban,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    console.error('Update profile error:', error)
    return { error: 'Fehler beim Aktualisieren des Profils: ' + error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
