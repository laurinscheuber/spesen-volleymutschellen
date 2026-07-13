import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/Layout'
import Lightbox from '@/components/Lightbox'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronLeft, Calendar, FileText, CheckCircle, XCircle, Info } from 'lucide-react'

export default async function UserReportDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  const { data: report, error } = await supabase
    .from('expense_reports')
    .select(`
      id,
      created_at,
      status,
      paid_at,
      admin_notes,
      user_id,
      expense_items (
        id,
        amount,
        date,
        purpose,
        receipt_url,
        team,
        categories (
          name
        )
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !report) redirect('/dashboard')

  if (report.user_id !== user.id && profile?.role !== 'admin') redirect('/dashboard')

  const items = (report.expense_items as any[]) || []
  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ausbezahlt':
        return (
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-[11px] font-bold">
            <CheckCircle className="h-4 w-4" />
            Ausbezahlt
          </div>
        )
      case 'abgelehnt':
        return (
          <div className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg text-[11px] font-bold">
            <XCircle className="h-4 w-4" />
            Abgelehnt
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-[11px] font-bold">
            <Info className="h-4 w-4" />
            Offen – Warte auf Freigabe
          </div>
        )
    }
  }

  return (
    <AppLayout profile={profile || { full_name: 'Nutzer', email: '', role: 'user' }}>
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        {/* Back */}
        <Link href="/dashboard">
          <Button variant="ghost" className="text-[#C0C0C0] hover:text-white hover:bg-[#22307B]/50 pl-0 gap-1">
            <ChevronLeft className="h-4 w-4" />
            Zurück zur Übersicht
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#4B4B4B]/50 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black uppercase tracking-wider text-[#E5EAF7] flex items-center gap-2">
              <FileText className="h-6 w-6 text-[#4C6EBA]" />
              Spesenbericht Details
            </h1>
            <p className="text-[11px] text-[#C0C0C0] font-mono">ID: {report.id}</p>
          </div>
          <div>{getStatusBadge(report.status)}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Metadata Card */}
          <Card className="border-[#4B4B4B] bg-[#22307B] text-[#E5EAF7] shadow-md md:col-span-1">
            <CardHeader className="border-b border-[#4B4B4B]/50 pb-4">
              <CardTitle className="text-[11px] font-bold text-[#C0C0C0] uppercase tracking-wider">Abrechnungs-Info</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#4C6EBA]/10 rounded-md border border-[#4C6EBA]/20">
                  <Calendar className="h-3.5 w-3.5 text-[#4C6EBA]" />
                </div>
                <div>
                  <p className="text-[10px] text-[#C0C0C0]">Eingereicht am</p>
                  <p className="text-[#E5EAF7] font-mono text-[13px]">
                    {new Date(report.created_at).toLocaleDateString('de-CH', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {report.paid_at && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#C0C0C0]">Ausbezahlt am</p>
                    <p className="text-[#E5EAF7] font-mono text-[13px]">
                      {new Date(report.paid_at).toLocaleDateString('de-CH', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[#4B4B4B]/50">
                <p className="text-[10px] text-[#C0C0C0] uppercase tracking-wider mb-1">Gesamtbetrag</p>
                <p className="text-2xl font-bold text-white font-mono">CHF {totalAmount}</p>
              </div>
            </CardContent>
          </Card>

          {/* Items & Notes */}
          <div className="md:col-span-2 space-y-6">
            {report.status === 'abgelehnt' && (
              <Card className="border-rose-500/20 bg-rose-500/5 text-[#E5EAF7] shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[13px] font-bold text-rose-400 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" />
                    Begründung für die Ablehnung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[13px] whitespace-pre-wrap italic text-[#E5EAF7]/80">
                    {report.admin_notes || 'Keine Begründung angegeben.'}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border-[#4B4B4B] bg-[#22307B] text-[#E5EAF7] shadow-md">
              <CardHeader className="border-b border-[#4B4B4B]/50 pb-4">
                <CardTitle className="text-[11px] font-bold text-[#C0C0C0] uppercase tracking-wider">Abrechnungsposten</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-[#4B4B4B]/50">
                        <TableHead className="text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Datum</TableHead>
                        <TableHead className="text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Kategorie</TableHead>
                        <TableHead className="text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Team</TableHead>
                        <TableHead className="text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Zweck</TableHead>
                        <TableHead className="text-right text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Betrag</TableHead>
                        <TableHead className="w-28" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id} className="border-[#4B4B4B]/30 hover:bg-[#1B255F]/30 transition-colors">
                          <TableCell className="text-[#E5EAF7]/80 font-mono text-xs">
                            {new Date(item.date).toLocaleDateString('de-CH')}
                          </TableCell>
                          <TableCell className="text-[#E5EAF7]/80 text-xs">{item.categories?.name}</TableCell>
                          <TableCell className="text-[#E5EAF7]/80 text-xs">{item.team || 'Allgemein'}</TableCell>
                          <TableCell className="text-[#C0C0C0] text-xs whitespace-pre-wrap">{item.purpose}</TableCell>
                          <TableCell className="text-right text-white font-mono text-xs font-semibold">
                            CHF {Number(item.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Lightbox url={item.receipt_url} label="Beleg" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
