import { createClient } from '@/lib/supabase/server'
import AdminDashboard from './AdminDashboard'
import AppLayout from '@/components/Layout'

export default async function AdminPage() {
  const supabase = await createClient()

  // Get current user profile
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user?.id || '')
    .single()

  // Fetch open reports (FIFO order)
  const { data: openReports } = await supabase
    .from('expense_reports')
    .select(`
      id,
      created_at,
      status,
      profiles (
        full_name,
        email,
        iban
      ),
      expense_items (
        amount
      )
    `)
    .eq('status', 'offen')
    .order('created_at', { ascending: true })

  const formattedReports = (openReports || []).map((report: any) => {
    const total = (report.expense_items || []).reduce((sum: number, item: any) => sum + Number(item.amount), 0)
    const itemsCount = (report.expense_items || []).length
    const userProfile = report.profiles as any
    return {
      id: report.id,
      created_at: report.created_at,
      status: report.status,
      user_name: userProfile?.full_name || 'Unbekannt',
      user_email: userProfile?.email || '',
      iban: userProfile?.iban || '',
      total,
      itemsCount
    }
  })

  return (
    <AppLayout profile={profile || { full_name: 'Kassier', email: '', role: 'admin' }}>
      <div className="space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 mb-2">
          <h1 className="text-[27px] font-black uppercase tracking-wider text-[#1B255F] leading-tight">Kassier-Dashboard</h1>
          <p className="text-[13px] text-slate-500">Übersicht aller ausstehenden Spesenberichte und Webling-Export.</p>
        </div>

        <AdminDashboard reports={formattedReports} />
      </div>
    </AppLayout>
  )
}
