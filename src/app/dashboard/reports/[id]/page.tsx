import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/Layout'
import Lightbox from '@/components/Lightbox'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronLeft, Calendar, FileText, CheckCircle, XCircle, Info, Trash2 } from 'lucide-react'
import { deleteExpenseReport } from '@/app/actions/expenses'

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
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-[11px] font-bold">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            Ausbezahlt
          </div>
        )
      case 'in_auftrag':
        return (
          <div className="flex items-center gap-1.5 text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-lg text-[11px] font-bold">
            <Info className="h-4 w-4 text-sky-600" />
            Zahlung erfasst (In Auftrag)
          </div>
        )
      case 'abgelehnt':
        return (
          <div className="flex items-center gap-1.5 text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg text-[11px] font-bold">
            <XCircle className="h-4 w-4 text-red-600" />
            Abgelehnt
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-[11px] font-bold">
            <Info className="h-4 w-4 text-amber-600" />
            Offen – Warte auf Freigabe
          </div>
        )
    }
  }

  async function handleDelete() {
    'use server'
    await deleteExpenseReport(params.id)
    redirect('/dashboard')
  }

  return (
    <AppLayout profile={profile || { full_name: 'Nutzer', email: '', role: 'user' }}>
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        {/* Back */}
        <Link href="/dashboard">
          <Button variant="ghost" className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 pl-0 gap-1">
            <ChevronLeft className="h-4 w-4" />
            Zurück zur Übersicht
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black uppercase tracking-wider text-[#1B255F] flex items-center gap-2">
              <FileText className="h-6 w-6 text-[#1B255F]" />
              Spesenbericht Details
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">ID: {report.id}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {getStatusBadge(report.status)}
            {(report.status === 'offen' || report.status === 'abgelehnt') && (
              <form action={handleDelete}>
                <Button
                  type="submit"
                  variant="outline"
                  className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 h-9 px-4 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Bericht löschen
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Metadata Card */}
          <Card className="border-slate-200 bg-white text-slate-900 shadow-md md:col-span-1 rounded-xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Abrechnungs-Info</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#1B255F]/5 rounded-md border border-[#1B255F]/10">
                  <Calendar className="h-3.5 w-3.5 text-[#1B255F]" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Eingereicht am</p>
                  <p className="text-slate-700 font-mono text-[13px]">
                    {new Date(report.created_at).toLocaleDateString('de-CH', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {report.paid_at && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 rounded-md border border-emerald-100">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Ausbezahlt am</p>
                    <p className="text-slate-700 font-mono text-[13px]">
                      {new Date(report.paid_at).toLocaleDateString('de-CH', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Gesamtbetrag</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">CHF {totalAmount}</p>
              </div>
            </CardContent>
          </Card>

          {/* Items & Notes */}
          <div className="md:col-span-2 space-y-6">
            {report.status === 'abgelehnt' && (
              <Card className="border-red-200 bg-red-50 text-red-800 shadow-sm rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[13px] font-bold text-red-800 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Begründung für die Ablehnung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[13px] whitespace-pre-wrap italic text-red-800/90">
                    {report.admin_notes || 'Keine Begründung angegeben.'}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Abrechnungsposten</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Datum</TableHead>
                        <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Kategorie</TableHead>
                        <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Team</TableHead>
                        <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Zweck</TableHead>
                        <TableHead className="text-right text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Betrag</TableHead>
                        <TableHead className="w-28" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <TableCell className="text-slate-700 font-mono text-xs">
                            {new Date(item.date).toLocaleDateString('de-CH')}
                          </TableCell>
                          <TableCell className="text-slate-800 text-xs font-semibold">{item.categories?.name}</TableCell>
                          <TableCell className="text-slate-700 text-xs">{item.team || 'Allgemein'}</TableCell>
                          <TableCell className="text-slate-500 text-xs whitespace-pre-wrap">{item.purpose}</TableCell>
                          <TableCell className="text-right text-slate-900 font-mono text-xs font-bold">
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
