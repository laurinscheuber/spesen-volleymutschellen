'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCategory(name: string) {
  if (!name || !name.trim()) {
    return { error: 'Kategoriename ist erforderlich.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Nicht authentifiziert.' }
  }

  // Guard: Admin Check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Keine Administrator-Rechte.' }
  }

  const { error } = await supabase
    .from('categories')
    .insert({ name: name.trim(), is_active: true })

  if (error) {
    console.error('Failed to create category:', error)
    if (error.code === '23505') {
      return { error: 'Eine Kategorie mit diesem Namen existiert bereits.' }
    }
    return { error: 'Kategorie konnte nicht erstellt werden: ' + error.message }
  }

  revalidatePath('/admin/categories')
  revalidatePath('/dashboard/new')
  return { success: true }
}

export async function toggleCategoryActive(id: string, currentStatus: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Nicht authentifiziert.' }
  }

  // Guard: Admin Check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Keine Administrator-Rechte.' }
  }

  const { error } = await supabase
    .from('categories')
    .update({ is_active: !currentStatus })
    .eq('id', id)

  if (error) {
    console.error('Failed to toggle category state:', error)
    return { error: 'Kategorie-Status konnte nicht geändert werden: ' + error.message }
  }

  revalidatePath('/admin/categories')
  revalidatePath('/dashboard/new')
  return { success: true }
}
