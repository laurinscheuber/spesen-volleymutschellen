import { createClient } from '@/lib/supabase/server'
import DashboardList from './DashboardList'
import AppLayout from '@/components/Layout'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'

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

        <DashboardList reports={reportsWithTotals} />
      </div>
    </AppLayout>
  )
}
