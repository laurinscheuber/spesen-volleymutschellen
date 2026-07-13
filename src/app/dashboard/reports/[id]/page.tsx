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
  const params = await props.params;
  const supabase = await createClient()

  // Get current user profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  // Fetch report details
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
        categories (
          name
        )
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !report) {
    redirect('/dashboard')
  }

  // Ensure owner is viewing (unless they are admin, but admins use /admin)
  if (report.user_id !== user.id && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const items = (report.expense_items as any[]) || []
  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ausbezahlt':
        return (
          <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md text-xs font-semibold">
            <CheckCircle className="h-4 w-4" />
            <span>Ausbezahlt</span>
          </div>
        )
      case 'abgelehnt':
        return (
          <div className="flex items-center gap-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md text-xs font-semibold">
            <XCircle className="h-4 w-4" />
            <span>Abgelehnt</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md text-xs font-semibold">
            <Info className="h-4 w-4" />
            <span>Offen (Warte auf Freigabe)</span>
          </div>
        )
    }
  }

  return (
    <AppLayout profile={profile || { full_name: 'Nutzer', email: '', role: 'user' }}>
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        {/* Back Button */}
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" className="text-slate-400 hover:text-white pl-0 gap-1">
              <ChevronLeft className="h-4 w-4" />
              Zurück zur Übersicht
            </Button>
          </Link>
        </div>

        {/* Report Overview Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-500" />
              Spesenbericht Details
            </h1>
            <p className="text-xs text-slate-500 font-mono">ID: {report.id}</p>
          </div>
          <div>{getStatusBadge(report.status)}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Metadata Card */}
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-md md:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Abrechnungs-Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Eingereicht am</p>
                  <p className="text-slate-200 font-mono">
                    {new Date(report.created_at).toLocaleDateString('de-CH', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {report.paid_at && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-xs text-slate-500">Ausbezahlt am</p>
                    <p className="text-slate-200 font-mono">
                      {new Date(report.paid_at).toLocaleDateString('de-CH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-850">
                <p className="text-xs text-slate-500">Gesamtbetrag</p>
                <p className="text-xl font-mono text-white font-bold">CHF {totalAmount}</p>
              </div>
            </CardContent>
          </Card>

          {/* Items / Admin Notes Card */}
          <div className="md:col-span-2 space-y-6">
            {/* Rejection comment */}
            {report.status === 'abgelehnt' && (
              <Card className="border-rose-500/20 bg-rose-500/5 text-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-rose-400 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" />
                    Begründung für die Ablehnung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap italic">
                    {report.admin_notes || 'Keine Begründung angegeben.'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* List of items */}
            <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Abrechnungsposten</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="border-slate-850">
                      <TableRow className="hover:bg-transparent border-slate-850">
                        <TableHead className="text-slate-450 font-medium">Datum</TableHead>
                        <TableHead className="text-slate-450 font-medium">Kategorie</TableHead>
                        <TableHead className="text-slate-450 font-medium">Zweck</TableHead>
                        <TableHead className="text-right text-slate-450 font-medium">Betrag</TableHead>
                        <TableHead className="w-28"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id} className="border-slate-850 hover:bg-slate-900/10">
                          <TableCell className="text-slate-300 font-mono text-xs">
                            {new Date(item.date).toLocaleDateString('de-CH')}
                          </TableCell>
                          <TableCell className="text-slate-300 text-xs">{item.categories?.name}</TableCell>
                          <TableCell className="text-slate-350 text-xs whitespace-pre-wrap">{item.purpose}</TableCell>
                          <TableCell className="text-right text-white font-mono text-xs">
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
