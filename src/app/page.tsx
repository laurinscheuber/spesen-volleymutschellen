'use client'

import { useState } from 'react'
import { signInWithMagicLink } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Loader2, Mail, Volleyball } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const result = await signInWithMagicLink(formData)

    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
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
            <CardTitle className="text-2xl font-bold tracking-tight text-white">Volley Mutschellen</CardTitle>
            <CardDescription className="text-slate-400">Spesenabrechnung & Belege</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <div className="rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-400 border border-emerald-500/20 space-y-2">
              <p className="font-semibold text-center">Magic Link gesendet!</p>
              <p className="text-xs text-slate-300 text-center">
                Wir haben dir einen Anmeldelink geschickt. Bitte überprüfe dein E-Mail-Postfach (und eventuell den Spam-Ordner).
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@domain.ch"
                    required
                    disabled={loading}
                    className="pl-10 border-slate-800 bg-slate-950/50 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
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
                    Sende Link...
                  </>
                ) : (
                  'Einloggen mit Magic Link'
                )}
              </Button>
            </form>
          )}

          <div className="text-center text-xs text-slate-500">
            Passwortloser Login. Nach dem Klick erhältst du einen sicheren Link per E-Mail.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
