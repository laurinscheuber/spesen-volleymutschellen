import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/Layout'
import AdminStatsDashboard from './AdminStatsDashboard'

export default async function AdminStatsPage() {
  const supabase = await createClient()

  // Get current user profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch all paid expense items for statistics
  const { data: items } = await supabase
    .from('expense_items')
    .select(`
      id,
      amount,
      date,
      team,
      categories (
        name
      ),
      expense_reports!inner (
        status
      )
    `)
    .eq('expense_reports.status', 'ausbezahlt')

  const formattedItems = (items || []).map((item: any) => ({
    id: item.id,
    amount: Number(item.amount),
    date: item.date,
    team: item.team || 'Anderes / Kein Team',
    category_name: item.categories?.name || 'Unbekannt'
  }))

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 mb-2">
          <h1 className="text-[27px] font-black uppercase tracking-wider text-[#1B255F] leading-tight">Spesen-Statistiken</h1>
          <p className="text-[13px] text-slate-500">Übersicht aller ausbezahlten Gelder, aufgeteilt nach Kategorien, Teams und Zeiträumen.</p>
        </div>

        <AdminStatsDashboard initialItems={formattedItems} />
      </div>
    </AppLayout>
  )
}
