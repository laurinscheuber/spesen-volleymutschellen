import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/Layout'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, iban, role')
    .eq('id', user.id)
    .single()

  return (
    <AppLayout profile={profile || { full_name: 'Nutzer', email: '', role: 'user' }}>
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        <div className="flex flex-col gap-1 border-b border-slate-200 pb-4">
          <h1 className="text-xl sm:text-2xl lg:text-[27px] font-black uppercase tracking-wider text-[#1B255F] leading-tight break-words">
            Profil & Auszahlung
          </h1>
          <p className="text-[13px] text-slate-500">
            Verwalte deine Kontaktdaten und deine Bankverbindung für Spesenauszahlungen.
          </p>
        </div>

        <ProfileForm
          initialProfile={{
            full_name: profile?.full_name || '',
            email: profile?.email || user.email || '',
            iban: profile?.iban || '',
          }}
        />
      </div>
    </AppLayout>
  )
}
