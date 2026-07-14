'use client'

import { useState } from 'react'
import { signInWithPassword, signUpWithPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Loader2, Mail, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            hd: 'volleymutschellen.ch',
          },
        },
      })
      if (err) throw err
    } catch (err: any) {
      setError(err.message || 'Google Login fehlgeschlagen.')
      setLoading(false)
    }
  }

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
          <div className="pt-2">
            <p className="font-black uppercase tracking-widest text-[14px] text-[#1B255F]">Spesenabrechnung & Belege</p>
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

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400">Oder</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                variant="outline"
                className="w-full border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-5 rounded-lg flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.555 0-6.444-2.889-6.444-6.444s2.889-6.444 6.444-6.444c1.607 0 3.078.583 4.223 1.547l3.056-3.056C19.034 2.148 15.86 1 12.24 1 5.756 1 .5 6.256.5 12.74S5.756 24.48 12.24 24.48c6.12 0 11.23-4.4 11.23-11.24 0-.74-.066-1.455-.19-2.155H12.24z"
                  />
                </svg>
                Mit Google anmelden
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
