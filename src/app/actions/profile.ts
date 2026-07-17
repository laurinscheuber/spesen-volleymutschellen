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

  // Upsert profiles table.
  // Using upsert ensures that if the profile row is missing (e.g. after a DB reset),
  // it gets created.
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: fullName.trim(),
      iban: cleanIban,
      email: user.email || '',
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('Update profile error:', error)
    return { error: 'Fehler beim Aktualisieren des Profils: ' + error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateUserRole(userId: string, newRole: 'user' | 'admin') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Nicht authentifiziert.' }
  }

  // Check if caller is admin
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'admin') {
    return { error: 'Keine Administrator-Rechte.' }
  }

  // Update target user's role
  const { error } = await supabase
    .from('profiles')
    .update({
      role: newRole,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Update user role error:', error)
    return { error: 'Fehler beim Aktualisieren der Rolle: ' + error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function createMemberProfile(formData: {
  fullName: string
  iban: string
  email?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Nicht authentifiziert.' }
  }

  // Check admin status
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'admin') {
    return { error: 'Keine Administrator-Rechte.' }
  }

  if (!formData.fullName || !formData.fullName.trim()) {
    return { error: 'Vollständiger Name ist erforderlich.' }
  }

  const cleanIban = formData.iban.replace(/\s+/g, '').toUpperCase()
  if (cleanIban.length < 15) {
    return { error: 'Ungültiges IBAN-Format. Mindestens 15 Zeichen erforderlich.' }
  }

  const email = formData.email?.trim() || null

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      full_name: formData.fullName.trim(),
      iban: cleanIban,
      email: email,
      role: 'user'
    })
    .select()
    .single()

  if (error) {
    console.error('Create member profile error:', error)
    if (error.code === '23505') {
      return { error: 'Ein Mitglied mit dieser E-Mail-Adresse existiert bereits.' }
    }
    return { error: 'Fehler beim Erstellen des Mitglieds: ' + error.message }
  }

  revalidatePath('/admin/members')
  revalidatePath('/dashboard/new')
  return { success: true, member: data }
}
