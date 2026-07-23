import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/Layout'
import HistoricalExpenseForm from './HistoricalExpenseForm'

export default async function NewHistoricalExpensePage() {
  const supabase = await createClient()

  // Fetch current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  // Fetch admin profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch profiles for target member selection
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, iban')
    .order('full_name', { ascending: true })

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name', { ascending: true })

  return (
    <AppLayout profile={profile}>
      <div className="max-w-4xl mx-auto w-full">
        <HistoricalExpenseForm
          profiles={profiles || []}
          categories={categories || []}
        />
      </div>
    </AppLayout>
  )
}
