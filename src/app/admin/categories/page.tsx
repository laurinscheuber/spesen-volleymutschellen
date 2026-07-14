import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CategoryList from './CategoryList'
import AppLayout from '@/components/Layout'

export default async function AdminCategoriesPage() {
  const supabase = await createClient()

  // Get current user profile
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user?.id || '')
    .single()

  // Guard: Only admins allowed
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, is_active')
    .order('name')

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 mb-2">
          <h1 className="text-[27px] font-black uppercase tracking-wider text-[#1B255F] leading-tight">Buchungskategorien</h1>
          <p className="text-[13px] text-slate-500">Verwalte die Kategorien für Spesenabrechnungen.</p>
        </div>

        <CategoryList categories={categories || []} />
      </div>
    </AppLayout>
  )
}
