import { createClient } from '@/lib/supabase/server'
import DashboardList from './DashboardList'
import AppLayout from '@/components/Layout'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusCircle, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current user profile
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user?.id || '')
    .single()

  // If user is admin, fetch the count of open reports from other users
  let openReportsCount = 0
  if (profile?.role === 'admin') {
    const { count } = await supabase
      .from('expense_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'offen')
    openReportsCount = count || 0
  }

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <h1 className="text-[27px] font-black uppercase tracking-wider text-[#1B255F] leading-tight">Meine Spesenabrechnungen</h1>
            <p className="text-[13px] text-slate-500">Übersicht über deine eingereichten Berichte und deren Status.</p>
          </div>
          <div className="sm:text-right">
            <Link href="/dashboard/new">
              <Button className="bg-[#1B255F] hover:bg-[#1B255F]/90 text-white font-bold px-5 py-5 rounded-lg shadow-md gap-1.5 transition-all">
                <PlusCircle className="h-4 w-4" />
                Spesen einreichen
              </Button>
            </Link>
          </div>
        </div>

        {openReportsCount > 0 && (
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-100 p-2 rounded-lg text-amber-800 shrink-0">
                <AlertCircle className="h-5 w-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-amber-900 text-sm">Ausstehende Spesenberichte</h3>
                <p className="text-amber-700 text-xs leading-relaxed">
                  Es gibt aktuell <strong>{openReportsCount} offene Spesenabrechnung{openReportsCount === 1 ? '' : 'en'}</strong> von Mitgliedern, die auf deine Prüfung und Auszahlung warten.
                </p>
              </div>
            </div>
            <Link href="/admin" className="shrink-0">
              <Button size="sm" className="bg-[#1B255F] hover:bg-[#1B255F]/90 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all">
                Spesen prüfen →
              </Button>
            </Link>
          </div>
        )}

        <DashboardList reports={reportsWithTotals} />
      </div>
    </AppLayout>
  )
}
