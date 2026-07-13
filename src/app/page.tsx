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
    <div className="flex min-h-screen items-center justify-center bg-[#1B255F] px-4 py-12 text-[#E5EAF7] relative overflow-hidden">
      <div className="absolute inset-0 bg-net-pattern -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#4C6EBA]/15 via-[#1B255F]/90 to-[#1B255F] -z-10" />
      
      <Card className="w-full max-w-md border-[#4C6EBA]/20 bg-[#22307B] text-[#E5EAF7] shadow-2xl shadow-[#1B255F]">
        {/* top accent stripe */}
        <div className="h-1 w-full rounded-t-xl bg-[#4C6EBA]" />
        <CardHeader className="space-y-5 text-center pt-7">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#4C6EBA]/10 ring-1 ring-[#4C6EBA]/30">
            <Volleyball className="h-8 w-8 text-[#4C6EBA] animate-[spin_6s_linear_infinite]" />
          </div>
          <div className="space-y-1">
            <h1 className="font-black text-[31px] uppercase tracking-widest text-[#E5EAF7] leading-tight">Volley Mutschellen</h1>
            <p className="font-semibold text-[13px] text-[#C0C0C0] uppercase tracking-[0.2em]">Spesenabrechnung & Belege</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {success ? (
            <div className="rounded-lg bg-emerald-500/10 p-4 text-[13px] text-emerald-400 border border-emerald-500/20 space-y-2">
              <p className="font-semibold text-center">Magic Link gesendet!</p>
              <p className="text-[13px] text-[#E5EAF7] text-center">
                Wir haben dir einen Anmeldelink geschickt. Bitte überprüfe dein E-Mail-Postfach (und eventuell den Spam-Ordner).
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-[13px] font-semibold text-[#E5EAF7]">
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#C0C0C0]" />
                  <Input
                     id="email"
                     name="email"
                     type="email"
                     placeholder="name@domain.ch"
                     required
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
                    Sende Link...
                  </>
                ) : (
                  'Einloggen mit Magic Link'
                )}
              </Button>
            </form>
          )}

          <div className="text-center text-[13px] font-normal text-[#E5EAF7]/80">
            Passwortloser Login. Nach dem Klick erhältst du einen sicheren Link per E-Mail.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
