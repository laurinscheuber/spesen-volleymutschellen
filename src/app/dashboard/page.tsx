import { createClient } from '@/lib/supabase/server'
import DashboardList from './DashboardList'
import AppLayout from '@/components/Layout'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current user profile
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user?.id || '')
    .single()

  // Get user's reports with item counts & amounts
  const { data: reports } = await supabase
    .from('expense_reports')
    .select(`
      id,
      created_at,
      status,
      paid_at,
      admin_notes,
      expense_items (
        amount
      )
    `)
    .eq('user_id', user?.id || '')
    .order('created_at', { ascending: false })

  const reportsWithTotals = (reports || []).map((report: any) => {
    const total = (report.expense_items || []).reduce((sum: number, item: any) => sum + Number(item.amount), 0)
    const itemsCount = (report.expense_items || []).length
    return {
      id: report.id,
      created_at: report.created_at,
      status: report.status,
      paid_at: report.paid_at,
      admin_notes: report.admin_notes,
      total,
      itemsCount
    }
  })

  return (
    <AppLayout profile={profile || { full_name: 'Nutzer', email: '', role: 'user' }}>
      <div className="space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">Meine Spesenabrechnungen</h1>
          <p className="text-sm text-slate-400">Übersicht über deine eingereichten Berichte und deren Status.</p>
        </div>

        <DashboardList reports={reportsWithTotals} />
      </div>
    </AppLayout>
  )
}
