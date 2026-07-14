import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/Layout'
import AdminArchiveList from './AdminArchiveList'

export default async function AdminArchivePage() {
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

  // Fetch all categories for filter dropdown
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  // Fetch all reports (newest first)
  const { data: reports } = await supabase
    .from('expense_reports')
    .select(`
      id,
      created_at,
      status,
      paid_at,
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

  const formattedReports = (reports || []).map((report: any) => {
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
      paid_at: report.paid_at,
      user_name: userProfile?.full_name || 'Unbekannt',
      user_email: userProfile?.email || '',
      iban: userProfile?.iban || '',
      total,
      itemsCount,
      // Metadata fields to make searching extremely easy in client component
      categories: Array.from(new Set(categoriesList)),
      purposes: Array.from(new Set(purposesList)),
      teams: Array.from(new Set(teamsList)),
    }
  })

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 mb-2">
          <h1 className="text-[27px] font-black uppercase tracking-wider text-[#1B255F] leading-tight">Spesenarchiv & Suche</h1>
          <p className="text-[13px] text-slate-500">Übersicht und Detail-Durchsuchbarkeit aller jemals eingereichten Spesenmappen.</p>
        </div>

        <AdminArchiveList
          reports={formattedReports}
          categories={categories || []}
        />
      </div>
    </AppLayout>
  )
}
