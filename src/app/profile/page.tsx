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
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
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
    <div className="flex min-h-screen items-center justify-center bg-[#1B255F] px-4 py-12 text-[#E5EAF7] relative overflow-hidden">
      <div className="absolute inset-0 bg-net-pattern -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#4C6EBA]/15 via-[#1B255F]/90 to-[#1B255F] -z-10" />

      <Card className="w-full max-w-md border-[#4B4B4B] bg-[#22307B] text-[#E5EAF7] shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#4C6EBA]/10 ring-1 ring-[#4C6EBA]/20">
            <Volleyball className="h-8 w-8 text-[#4C6EBA] animate-[spin_6s_linear_infinite]" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black uppercase tracking-wider text-[#E5EAF7]">
              Stammdaten hinterlegen
            </CardTitle>
            <CardDescription className="text-[13px] text-[#C0C0C0]">
              Bevor du Spesen einreichen kannst, benötigen wir deinen Namen und deine IBAN für die Auszahlung.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-wider text-[#C0C0C0]">
                Vollständiger Name (Vorname & Nachname)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-[#C0C0C0]" />
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Max Muster"
                  required
                  disabled={loading}
                  className="pl-10 border-[#4B4B4B] bg-[#1B255F]/50 text-white placeholder-[#C0C0C0]/50 focus:border-[#4C6EBA] focus:ring-1 focus:ring-[#4C6EBA]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="iban" className="text-[10px] font-bold uppercase tracking-wider text-[#C0C0C0]">
                IBAN für Auszahlung (Schweizer Bankkonto)
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-[#C0C0C0]" />
                <Input
                  id="iban"
                  name="iban"
                  placeholder="CH93 0000 0000 0000 0000 0"
                  required
                  disabled={loading}
                  className="pl-10 border-[#4B4B4B] bg-[#1B255F]/50 text-white placeholder-[#C0C0C0]/50 focus:border-[#4C6EBA] focus:ring-1 focus:ring-[#4C6EBA]"
                />
              </div>
              <p className="text-[10px] text-[#C0C0C0]/70">
                Deine IBAN wird für die Spesenüberweisung durch den Kassier verwendet.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-[13px] text-destructive-foreground border border-destructive/20">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4C6EBA] hover:bg-[#4C6EBA]/90 text-white font-semibold transition-all duration-200"
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
