'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateReportStatus } from '@/app/actions/expenses'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, Calendar, User, Copy, Check, CheckCircle2, XCircle, Loader2, Info, Eye } from 'lucide-react'

interface Item {
  id: string
  amount: number
  date: string
  purpose: string
  receipt_url: string
  category_name: string
}

interface ReportDetails {
  id: string
  created_at: string
  status: 'offen' | 'ausbezahlt' | 'abgelehnt'
  user_name: string
  user_email: string
  iban: string
  items: Item[]
  total: number
}

export default function AdminReportDetail({ report }: { report: ReportDetails }) {
  const router = useRouter()
  const [selectedReceipt, setSelectedReceipt] = useState<string>(report.items[0]?.receipt_url || '')
  const [copied, setCopied] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [submitting, setSubmitting] = useState<'payout' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCopyIban = () => {
    navigator.clipboard.writeText(report.iban)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleApprove = async () => {
    if (!confirm('Diesen Spesenbericht als ausbezahlt markieren? Der Nutzer erhält eine E-Mail-Benachrichtigung.')) {
      return
    }

    setSubmitting('payout')
    setError(null)
    const result = await updateReportStatus(report.id, 'ausbezahlt')
    setSubmitting(null)

    if (result.error) {
      setError(result.error)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  const handleReject = async () => {
    setSubmitting('reject')
    setError(null)
    const result = await updateReportStatus(report.id, 'abgelehnt', adminNotes)
    setSubmitting(null)

    if (result.error) {
      setError(result.error)
    } else {
      setRejectDialogOpen(false)
      router.push('/admin')
      router.refresh()
    }
  }

  const isPdf = selectedReceipt.toLowerCase().split('?')[0].endsWith('.pdf')

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link href="/admin">
          <Button variant="ghost" className="text-slate-400 hover:text-white pl-0 gap-1 h-9 rounded-lg">
            <ChevronLeft className="h-4 w-4" />
            Zurück zu offenen Spesen
          </Button>
        </Link>
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Spesenabrechnung prüfen</h1>
          <p className="text-xs text-slate-500 font-mono mt-1">Bericht ID: {report.id}</p>
        </div>
        
        {report.status === 'offen' && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={submitting !== null}
              onClick={() => setRejectDialogOpen(true)}
              className="border-rose-500/25 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 h-10 px-5 rounded-lg transition-colors"
            >
              Ablehnen
            </Button>
            <Button
              disabled={submitting !== null}
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-500 text-white h-10 px-6 rounded-lg font-semibold shadow-md gap-2"
            >
              {submitting === 'payout' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Als ausbezahlt markieren
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive-foreground border border-destructive/20">
          {error}
        </div>
      )}

      {/* Main Grid: Details + Receipt Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: User details + Items (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Member Card */}
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-450 uppercase tracking-wider">Mitglied & Auszahlung</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="text-white font-medium">{report.user_name}</p>
                    <p className="text-xs text-slate-400">{report.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Eingereicht am</p>
                    <p className="text-slate-300 font-mono">
                      {new Date(report.created_at).toLocaleDateString('de-CH')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-slate-950/40 border border-slate-850 p-4 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Auszahlungs-IBAN</span>
                  <span className="font-mono text-xs text-white block mt-1 break-all">{report.iban}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyIban}
                  className="mt-2 text-xs border-slate-800 hover:bg-slate-900 text-slate-300 gap-1.5 h-8 w-full rounded-md"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Kopiert!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>IBAN kopieren</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Items Card */}
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-md">
            <CardHeader className="flex flex-row justify-between items-center pb-3">
              <CardTitle className="text-sm font-semibold text-slate-450 uppercase tracking-wider">Auszahlungsposten</CardTitle>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block">Gesamtsumme</span>
                <span className="font-mono text-base font-bold text-white">CHF {report.total.toFixed(2)}</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="border-slate-850">
                    <TableRow className="hover:bg-transparent border-slate-850">
                      <TableHead className="text-slate-400 font-medium">Datum</TableHead>
                      <TableHead className="text-slate-400 font-medium">Kategorie</TableHead>
                      <TableHead className="text-slate-400 font-medium">Zweck</TableHead>
                      <TableHead className="text-right text-slate-400 font-medium">Betrag</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.items.map((item) => (
                      <TableRow
                        key={item.id}
                        onClick={() => setSelectedReceipt(item.receipt_url)}
                        className={`border-slate-850 cursor-pointer transition-colors hover:bg-slate-900/20 ${
                          selectedReceipt === item.receipt_url ? 'bg-slate-900/30' : ''
                        }`}
                      >
                        <TableCell className="text-slate-300 font-mono text-xs">
                          {new Date(item.date).toLocaleDateString('de-CH')}
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs font-medium">{item.category_name}</TableCell>
                        <TableCell className="text-slate-350 text-xs truncate max-w-[160px]" title={item.purpose}>
                          {item.purpose}
                        </TableCell>
                        <TableCell className="text-right text-white font-mono text-xs font-semibold">
                          CHF {item.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-500 group-hover:text-white"
                            title="Vorschau wechseln"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Interactive Receipt Preview (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-md">
            <CardHeader className="pb-3 border-b border-slate-850">
              <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Beleg-Vorschau</span>
                {selectedReceipt && (
                  <a
                    href={selectedReceipt}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 normal-case font-normal"
                  >
                    Vollbild
                  </a>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {selectedReceipt ? (
                <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[350px] max-h-[500px]">
                  {isPdf ? (
                    <iframe
                      src={selectedReceipt}
                      className="w-full h-[400px] border-none"
                      title="Beleg PDF"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedReceipt}
                      alt="Beleg Foto"
                      className="max-h-[450px] w-auto object-contain p-1"
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <Info className="h-8 w-8 text-slate-700 mb-2" />
                  <p className="text-xs">Kein Beleg ausgewählt.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Reason Dialog Modal */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="border-slate-850 bg-slate-900 text-slate-100 rounded-xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-1.5">
              <XCircle className="h-5 w-5 text-rose-500" />
              Spesenbericht ablehnen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-400">
              Bitte gib eine Begründung für die Ablehnung an. Der Nutzer erhält diese Begründung per E-Mail.
            </p>
            <div className="space-y-1">
              <label htmlFor="notes" className="text-[10px] font-bold text-slate-500 uppercase">Begründung</label>
              <Textarea
                id="notes"
                placeholder="z.B. Beleg fehlt oder ist nicht lesbar..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="border-slate-800 bg-slate-950/50 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-550"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              className="border-slate-800 hover:bg-slate-950 text-slate-400 hover:text-white"
            >
              Abbrechen
            </Button>
            <Button
              disabled={submitting !== null || !adminNotes.trim()}
              onClick={handleReject}
              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-md"
            >
              {submitting === 'reject' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Jetzt ablehnen'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
