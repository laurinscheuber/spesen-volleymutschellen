import { createClient } from '@/lib/supabase/server'
import ExpenseCart from '@/components/ExpenseCart'
import AppLayout from '@/components/Layout'

export default async function NewExpensePage() {
  const supabase = await createClient()

  // Get active categories for user selection
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  // Get current user profile for Layout context
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user?.id || '')
    .single()

  return (
    <AppLayout profile={profile || { full_name: 'Nutzer', email: '', role: 'user' }}>
      <div className="space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">Spesen einreichen</h1>
          <p className="text-sm text-slate-400">Erstelle eine neue Sammelabrechnung und füge deine Belege hinzu.</p>
        </div>

        <ExpenseCart initialCategories={categories || []} />
      </div>
    </AppLayout>
  )
}
