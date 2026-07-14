import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminReportDetail from './AdminReportDetail'
import AppLayout from '@/components/Layout'

export default async function AdminReportPage(props: { 
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  // Get current user profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  // Guard: Only admins allowed
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch report details
  const { data: report, error } = await supabase
    .from('expense_reports')
    .select(`
      id,
      created_at,
      status,
      paid_at,
      admin_notes,
      user_id,
      profiles (
        full_name,
        email,
        iban
      ),
      expense_items (
        id,
        amount,
        date,
        purpose,
        receipt_url,
        team,
        categories (
          name
        )
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !report) {
    redirect('/admin')
  }

  // Calculate review queue progress if in queue mode
  const isQueueMode = searchParams.queue === 'true'
  let queueIndex: number | undefined = undefined
  let queueTotal: number | undefined = undefined
  let nextReportId: string | null = null

  if (isQueueMode) {
    const { data: allPending } = await supabase
      .from('expense_reports')
      .select('id')
      .in('status', ['offen', 'in_auftrag'])
      .order('created_at', { ascending: true })

    const pendingIds = (allPending || []).map((r) => r.id)
    const currentIndex = pendingIds.indexOf(params.id)
    if (currentIndex !== -1) {
      queueIndex = currentIndex + 1
      queueTotal = pendingIds.length
      nextReportId = currentIndex + 1 < pendingIds.length ? pendingIds[currentIndex + 1] : null
    }
  }

  // Map database details into frontend types
  const items = ((report.expense_items as any[]) || []).map((item) => ({
    id: item.id,
    amount: Number(item.amount),
    date: item.date,
    purpose: item.purpose,
    receipt_url: item.receipt_url,
    team: item.team,
    category_name: item.categories?.name || 'Unbekannt',
  }))

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
  const reportOwner = report.profiles as any

  const reportDetails = {
    id: report.id,
    created_at: report.created_at,
    status: report.status as 'offen' | 'in_auftrag' | 'ausbezahlt' | 'abgelehnt',
    user_name: reportOwner?.full_name || 'Unbekannt',
    user_email: reportOwner?.email || '',
    iban: reportOwner?.iban || '',
    items,
    total: totalAmount,
  }

  return (
    <AppLayout profile={profile}>
      <div className="max-w-6xl mx-auto w-full">
        <AdminReportDetail 
          report={reportDetails}
          queueIndex={queueIndex}
          queueTotal={queueTotal}
          nextReportId={nextReportId}
        />
      </div>
    </AppLayout>
  )
}
