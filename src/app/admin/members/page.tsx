import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/Layout'
import AdminMembersList from '../AdminMembersList'

export default async function AdminMembersPage() {
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

  // Fetch all user profiles for members list
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email, iban, role')
    .order('full_name', { ascending: true })

  const formattedMembers = (members || []).map((m: any) => ({
    id: m.id,
    full_name: m.full_name || '',
    email: m.email || '',
    iban: m.iban || '',
    role: m.role
  }))

  // Fetch all reports to associate with member history
  const { data: reports } = await supabase
    .from('expense_reports')
    .select(`
      id,
      created_at,
      status,
      user_id,
      expense_items (
        amount
      )
    `)
    .order('created_at', { ascending: false })

  const formattedReports = (reports || []).map((report: any) => {
    const total = (report.expense_items || []).reduce((sum: number, item: any) => sum + Number(item.amount), 0)
    return {
      id: report.id,
      created_at: report.created_at,
      status: report.status,
      user_id: report.user_id,
      total
    }
  })

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 mb-2">
          <h1 className="text-xl sm:text-2xl lg:text-[27px] font-black uppercase tracking-wider text-[#1B255F] leading-tight break-words">Mitglieder & IBANs</h1>
          <p className="text-[13px] text-slate-500">Übersicht aller Vereinsmitglieder, hinterlegten Bankdaten und Vergabe von Kassier-Rechten.</p>
        </div>

        <AdminMembersList
          members={formattedMembers}
          reports={formattedReports}
          currentUserId={user.id}
        />
      </div>
    </AppLayout>
  )
}
