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

  // Get current user profile for Layout context and IBAN validation
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, iban, role')
    .eq('id', user?.id || '')
    .single()

  // Fetch all user profiles for member selection (if admin)
  let members: Array<{ id: string; full_name: string; email: string | null; iban: string }> = []
  if (profile?.role === 'admin') {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, iban')
      .order('full_name', { ascending: true })
    
    members = (data || []).map((m: any) => ({
      id: m.id,
      full_name: m.full_name || '',
      email: m.email || null,
      iban: m.iban || ''
    }))
  }

  return (
    <AppLayout profile={profile || { full_name: 'Nutzer', email: '', role: 'user' }}>
      <div className="space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-1 border-b border-slate-200 pb-4">
          <h1 className="text-[27px] font-black uppercase tracking-wider text-[#1B255F] leading-tight">Spesen einreichen</h1>
          <p className="text-[13px] text-slate-500">Erstelle eine neue Sammelabrechnung und füge deine Belege hinzu.</p>
        </div>

        <ExpenseCart 
          initialCategories={categories || []} 
          members={members}
          isAdmin={profile?.role === 'admin'}
          currentUserProfile={{
            id: user?.id || '',
            full_name: profile?.full_name || '',
            email: profile?.email || '',
            iban: profile?.iban || '',
          }}
        />
      </div>
    </AppLayout>
  )
}
