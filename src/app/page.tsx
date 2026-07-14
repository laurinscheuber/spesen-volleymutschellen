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
            <h1 className="font-black text-[27px] uppercase tracking-wider text-[#1B255F] leading-tight">Volley Mutschellen</h1>
            <p className="font-bold text-[18px] text-slate-500">Spesenabrechnung & Belege</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          {success ? (
            <div className="rounded-lg bg-emerald-50 p-4 text-[13px] text-emerald-800 border border-emerald-200 space-y-3">
              <p className="font-semibold text-center">Registrierung erfolgreich!</p>
              <p className="text-[13px] text-slate-600 text-center">
                Dein Account wurde erstellt. Falls du die E-Mail-Bestätigung in Supabase aktiviert hast, bestätige bitte deinen Link. 
              </p>
              <p className="text-[13px] text-slate-600 text-center">
                Falls "Auto-Confirm" aktiv ist (oder du den User im Supabase Studio bestätigt hast), kannst du dich direkt einloggen.
              </p>
              <Button
                variant="outline"
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
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
              <div className="flex border-b border-slate-100 mb-4">
                <button
                  type="button"
                  onClick={() => { setError(null); setIsRegister(false); }}
                  className={`flex-1 pb-2 text-sm font-semibold transition-colors ${!isRegister ? 'border-b-2 border-[#1B255F] text-[#1B255F]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Einloggen
                </button>
                <button
                  type="button"
                  onClick={() => { setError(null); setIsRegister(true); }}
                  className={`flex-1 pb-2 text-sm font-semibold transition-colors ${isRegister ? 'border-b-2 border-[#1B255F] text-[#1B255F]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Registrieren
                </button>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-[13px] font-semibold text-slate-600">
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@domain.ch"
                    required
                    autoComplete="email"
                    disabled={loading}
                    className="pl-10 border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-[13px] font-semibold text-slate-600">
                  Passwort
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="pl-10 border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
                  />
                </div>
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
                    Bitte warten...
                  </>
                ) : (
                  isRegister ? 'Registrieren' : 'Einloggen'
                )}
              </Button>
            </form>
          )}

          <div className="text-center text-[13px] font-normal text-slate-400 pt-2">
            Sicheres Passwort-Login für Volley Mutschellen Mitglieder.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
