'use client'

import { useState } from 'react'
import { signInWithPassword, signUpWithPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Loader2, Mail, Lock, Volleyball } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const result = isRegister
      ? await signUpWithPassword(formData)
      : await signInWithPassword(formData)

    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      if (isRegister) {
        setSuccess(true)
      } else {
        router.refresh()
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1B255F] px-4 py-12 text-[#E5EAF7] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#4C6EBA]/10 via-[#1B255F] to-[#1B255F] -z-10" />
      
      <Card className="w-full max-w-md border-[#4B4B4B] bg-[#22307B] text-[#E5EAF7] shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#4C6EBA]/10 text-[#4C6EBA] ring-1 ring-[#4C6EBA]/20">
            <Volleyball className="h-8 w-8 text-[#4C6EBA] animate-[spin_6s_linear_infinite]" />
          </div>
          <div className="space-y-1">
            <h1 className="font-black text-[31px] uppercase tracking-wider text-[#E5EAF7] leading-tight">Volley Mutschellen</h1>
            <p className="font-bold text-[20px] text-[#E5EAF7]">Spesenabrechnung & Belege</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {success ? (
            <div className="rounded-lg bg-emerald-500/10 p-4 text-[13px] text-emerald-400 border border-emerald-500/20 space-y-3">
              <p className="font-semibold text-center">Registrierung erfolgreich!</p>
              <p className="text-[13px] text-[#E5EAF7]/90 text-center">
                Dein Account wurde erstellt. Falls du die E-Mail-Bestätigung in Supabase aktiviert hast, bestätige bitte deinen Link. 
              </p>
              <p className="text-[13px] text-[#E5EAF7]/90 text-center">
                Falls "Auto-Confirm" aktiv ist (oder du den User im Supabase Studio bestätigt hast), kannst du dich direkt einloggen.
              </p>
              <Button
                variant="outline"
                className="w-full border-[#4B4B4B] text-white hover:bg-[#1B255F]"
                onClick={() => {
                  setSuccess(false)
                  setIsRegister(false)
                }}
              >
                Zum Login wechseln
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex border-b border-[#4B4B4B] mb-2">
                <button
                  type="button"
                  onClick={() => { setError(null); setIsRegister(false); }}
                  className={`flex-1 pb-2 text-sm font-semibold transition-colors ${!isRegister ? 'border-b-2 border-[#4C6EBA] text-white' : 'text-[#C0C0C0] hover:text-white'}`}
                >
                  Einloggen
                </button>
                <button
                  type="button"
                  onClick={() => { setError(null); setIsRegister(true); }}
                  className={`flex-1 pb-2 text-sm font-semibold transition-colors ${isRegister ? 'border-b-2 border-[#4C6EBA] text-white' : 'text-[#C0C0C0] hover:text-white'}`}
                >
                  Registrieren
                </button>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-[13px] font-semibold text-[#E5EAF7]">
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C0C0C0]" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@domain.ch"
                    required
                    autoComplete="email"
                    disabled={loading}
                    className="pl-10 border-[#4B4B4B] bg-[#1B255F]/50 text-white placeholder-[#C0C0C0] focus:border-[#4C6EBA] focus:ring-1 focus:ring-[#4C6EBA]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-[13px] font-semibold text-[#E5EAF7]">
                  Passwort
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C0C0C0]" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="pl-10 border-[#4B4B4B] bg-[#1B255F]/50 text-white placeholder-[#C0C0C0] focus:border-[#4C6EBA] focus:ring-1 focus:ring-[#4C6EBA]"
                  />
                </div>
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
                    Bitte warten...
                  </>
                ) : (
                  isRegister ? 'Registrieren' : 'Einloggen'
                )}
              </Button>
            </form>
          )}

          <div className="text-center text-[13px] font-normal text-[#E5EAF7]/80">
            Sicheres Passwort-Login für Volley Mutschellen Mitglieder.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
