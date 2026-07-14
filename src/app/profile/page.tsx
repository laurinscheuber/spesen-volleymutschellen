'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Loader2, User, CreditCard, Volleyball } from 'lucide-react'

export default function ProfileOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [iban, setIban] = useState('')
  const [error, setError] = useState<string | null>(null)

  const formatIBAN = (value: string) => {
    const raw = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    const parts = []
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.substring(i, i + 4))
    }
    return parts.join(' ')
  }

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

    const formData = new FormData(e.currentTarget)
    // Clean spaces from IBAN before updating profile
    const rawIban = iban.replace(/\s/g, '')
    formData.set('iban', rawIban)

    const result = await updateProfile(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 relative overflow-hidden bg-net-pattern">
      <Card className="w-full max-w-md border-slate-200 bg-white text-slate-900 shadow-xl rounded-2xl">
        <CardHeader className="space-y-4 text-center pt-8">
          <div className="mx-auto flex h-24 w-auto items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="https://volleymutschellen.ch/images/volley-logo-white.png" 
              alt="Volley Mutschellen Logo" 
              className="h-20 w-auto logo-blue object-contain" 
            />
          </div>
          <div className="space-y-1">
            <h1 className="font-black text-[27px] uppercase tracking-wider text-[#1B255F] leading-tight">
              Stammdaten hinterlegen
            </h1>
            <CardDescription className="text-[13px] text-slate-500">
              Bevor du Spesen einreichen kannst, benötigen wir deinen Namen und deine IBAN für die Auszahlung.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Vollständiger Name (Vorname & Nachname)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Max Muster"
                  required
                  disabled={loading}
                  className="pl-10 border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="iban" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
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
                  className="pl-10 border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Deine IBAN wird für die Spesenüberweisung durch den Kassier verwendet.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-800 border border-red-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B255F] hover:bg-[#1B255F]/90 text-white font-semibold transition-all duration-200 py-5 rounded-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichere Profil...
                </>
              ) : (
                'Profil abschliessen & weiter'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
