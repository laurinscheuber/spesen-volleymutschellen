'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Loader2, User, CreditCard, CheckCircle2 } from 'lucide-react'

interface ProfileFormProps {
  initialProfile: {
    full_name: string
    email: string
    iban: string
  }
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState(initialProfile.full_name || '')

  const formatIBAN = (value: string) => {
    const raw = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    const parts = []
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.substring(i, i + 4))
    }
    return parts.join(' ')
  }

  const [iban, setIban] = useState(formatIBAN(initialProfile.iban || ''))
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatIBAN(e.target.value)
    if (formatted.replace(/\s/g, '').length <= 21) {
      setIban(formatted)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.set('fullName', fullName)
    formData.set('iban', iban.replace(/\s/g, ''))

    const result = await updateProfile(formData)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      router.refresh()
    }
  }

  return (
    <Card className="w-full max-w-xl border-slate-200 bg-white text-slate-900 shadow-md rounded-2xl">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-lg font-bold text-[#1B255F]">
          Mein Profil & IBAN
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Hier kannst du deinen Namen und deine IBAN für Spesenauszahlungen aktualisieren.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
              Vollständiger Name (Vorname & Nachname)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="fullName"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Max Muster"
                required
                disabled={loading}
                className="pl-10 border-slate-200 bg-white text-slate-900 text-xs focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="iban" className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
              IBAN für Auszahlung (Schweizer Bankkonto)
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="iban"
                name="iban"
                value={iban}
                onChange={handleIbanChange}
                placeholder="CH93 0000 0000 0000 0000 0"
                required
                disabled={loading}
                className="pl-10 border-slate-200 bg-white text-slate-900 font-mono text-xs focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Deine IBAN wird für die Spesenüberweisung durch den Kassier verwendet.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Profil und IBAN erfolgreich gespeichert!</span>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#1B255F] hover:bg-[#1B255F]/90 text-white font-semibold text-xs h-10 px-6 rounded-lg shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichere...
                </>
              ) : (
                'Profil speichern'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
