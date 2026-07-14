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

export async function deleteCategory(id: string, mergeToCategoryId?: string) {
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

  // Check if there are any related expense items
  const { data: relatedItems, error: itemsError } = await supabase
    .from('expense_items')
    .select('id')
    .eq('category_id', id)

  if (itemsError) {
    console.error('Failed to query related items:', itemsError)
    return { error: 'Fehler beim Prüfen der verknüpften Belege.' }
  }

  const count = relatedItems?.length || 0

  // If there are items and a merge target is specified, migrate them first
  if (count > 0) {
    if (!mergeToCategoryId) {
      return { error: 'Es gibt verknüpfte Belege. Bitte wähle eine Zielkategorie aus.' }
    }

    const { error: mergeError } = await supabase
      .from('expense_items')
      .update({ category_id: mergeToCategoryId })
      .eq('category_id', id)

    if (mergeError) {
      console.error('Failed to merge items:', mergeError)
      return { error: 'Belege konnten nicht verschoben werden: ' + mergeError.message }
    }
  }

  // Delete the category from categories table
  const { error: deleteError } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('Failed to delete category:', deleteError)
    return { error: 'Kategorie konnte nicht gelöscht werden: ' + deleteError.message }
  }

  revalidatePath('/admin/categories')
  revalidatePath('/dashboard/new')
  return { success: true }
}
