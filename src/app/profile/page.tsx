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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-950/30 via-slate-950 to-slate-950 -z-10" />
      
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20">
            <Volleyball className="h-8 w-8 text-blue-500 animate-[spin_6s_linear_infinite]" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-white">Stammdaten hinterlegen</CardTitle>
            <CardDescription className="text-slate-400">
              Bevor du Spesen einreichen kannst, benötigen wir deinen Namen und deine IBAN für die Auszahlung.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Vollständiger Name (Vorname & Nachname)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Max Muster"
                  required
                  disabled={loading}
                  className="pl-10 border-slate-800 bg-slate-950/50 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="iban" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                IBAN für Auszahlung (Schweizer Bankkonto)
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="iban"
                  name="iban"
                  placeholder="CH93 0000 0000 0000 0000 0"
                  required
                  disabled={loading}
                  className="pl-10 border-slate-800 bg-slate-950/50 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Deine IBAN wird für die Spesenüberweisung durch den Kassier verwendet.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive-foreground border border-destructive/20">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white transition-all duration-200"
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
