import { createClient } from '@/lib/supabase/server'
import AdminDashboard from './AdminDashboard'
import AppLayout from '@/components/Layout'
import { promoteDelayedPayments } from '@/app/actions/expenses'

export default async function AdminPage() {
  // Silent background auto-promotion of reports in 'in_auftrag' older than 24h
  await promoteDelayedPayments()

  const supabase = await createClient()

  // Get current user profile
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user?.id || '')
    .single()

  // Fetch all categories for filter dropdown
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  // Fetch all reports (newest first)
  const { data: allReports } = await supabase
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
        id,
        amount,
        purpose,
        team,
        categories (
          name
        )
      )
    `)
    .order('created_at', { ascending: false })

  const formattedReports = (allReports || []).map((report: any) => {
    const total = (report.expense_items || []).reduce((sum: number, item: any) => sum + Number(item.amount), 0)
    const itemsCount = (report.expense_items || []).length
    const userProfile = report.profiles as any

    // Gather all categories, purposes and teams for searchable index
    const categoriesList = (report.expense_items || []).map((item: any) => item.categories?.name || '')
    const purposesList = (report.expense_items || []).map((item: any) => item.purpose || '')
    const teamsList = (report.expense_items || []).map((item: any) => item.team || '')

    return {
      id: report.id,
      created_at: report.created_at,
      status: report.status,
      user_name: userProfile?.full_name || 'Unbekannt',
      user_email: userProfile?.email || '',
      iban: userProfile?.iban || '',
      total,
      itemsCount,
      // Metadata fields to make searching extremely easy in client component
      categories: Array.from(new Set(categoriesList)) as string[],
      purposes: Array.from(new Set(purposesList)) as string[],
      teams: Array.from(new Set(teamsList)) as string[],
    }
  })

  return (
    <AppLayout profile={profile || { full_name: 'Kassier', email: '', role: 'admin' }}>
      <div className="space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 mb-2">
          <h1 className="text-xl sm:text-2xl lg:text-[27px] font-black uppercase tracking-wider text-[#1B255F] leading-tight break-words">Kassier-Dashboard</h1>
          <p className="text-[13px] text-slate-500">Verwalte offene Abrechnungen, durchsuche alle Spesen und starte die Bearbeitungs-Warteschlange.</p>
        </div>

        <AdminDashboard 
          reports={formattedReports} 
          categories={categories || []} 
        />
      </div>
    </AppLayout>
  )
}
