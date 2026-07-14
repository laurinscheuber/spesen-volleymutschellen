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
  team?: string
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

function formatIban(iban: string): string {
  const clean = iban.replace(/\s/g, '')
  return clean.replace(/(.{4})/g, '$1 ').trim()
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
    setSubmitting('payout')
    setError(null)
    const result = await updateReportStatus(report.id, 'ausbezahlt')
    if (result.error) {
      setError(result.error)
      setSubmitting(null)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  const handleReject = async () => {
    setSubmitting('reject')
    setError(null)
    const result = await updateReportStatus(report.id, 'abgelehnt', adminNotes)
    if (result.error) {
      setError(result.error)
      setSubmitting(null)
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
          <Button variant="ghost" className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 pl-0 gap-1 h-9 rounded-lg">
            <ChevronLeft className="h-4 w-4" />
            Zurück zu offenen Spesen
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-[#1B255F]">Spesenabrechnung prüfen</h1>
          <p className="text-[11px] text-slate-400 font-mono mt-1">Bericht ID: {report.id}</p>
        </div>

        {report.status === 'offen' && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={submitting !== null}
              onClick={() => setRejectDialogOpen(true)}
              className="border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100/80 h-10 px-5 rounded-lg transition-colors shadow-sm"
            >
              Ablehnen
            </Button>
            <Button
              disabled={submitting !== null}
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-500 text-white h-10 px-6 rounded-lg font-semibold shadow-md gap-2"
            >
              {submitting === 'payout' ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-white" />
              )}
              Als ausbezahlt markieren
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-[13px] text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Member Card */}
          <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mitglied & Auszahlung</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#1B255F]/5 rounded-md border border-[#1B255F]/10">
                    <User className="h-3.5 w-3.5 text-[#1B255F]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Name</p>
                    <p className="text-slate-900 font-semibold text-[13px]">{report.user_name}</p>
                    <p className="text-[11px] text-slate-500">{report.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#1B255F]/5 rounded-md border border-[#1B255F]/10">
                    <Calendar className="h-3.5 w-3.5 text-[#1B255F]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Eingereicht am</p>
                    <p className="text-slate-700 font-mono text-[13px]">
                      {new Date(report.created_at).toLocaleDateString('de-CH')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Auszahlungs-IBAN</span>
                  <span className="font-mono text-xs text-slate-900 font-bold block mt-1 break-all">{formatIban(report.iban)}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyIban}
                  className="mt-2 text-xs border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 gap-1.5 h-8 w-full rounded-md shadow-sm bg-white"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
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
          <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
            <CardHeader className="border-b border-slate-100 pb-4 flex flex-row justify-between items-center">
              <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Auszahlungsposten</CardTitle>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block">Gesamtsumme</span>
                <span className="font-mono text-base font-bold text-slate-900">CHF {report.total.toFixed(2)}</span>
              </div>
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
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.items.map((item) => (
                      <TableRow
                        key={item.id}
                        onClick={() => setSelectedReceipt(item.receipt_url)}
                        className={`border-slate-100 cursor-pointer transition-colors hover:bg-slate-50/50 ${
                          selectedReceipt === item.receipt_url ? 'bg-slate-50 border-l-2 border-l-[#1B255F]' : ''
                        }`}
                      >
                        <TableCell className="text-slate-700 font-mono text-xs">
                          {new Date(item.date).toLocaleDateString('de-CH')}
                        </TableCell>
                        <TableCell className="text-slate-800 text-xs font-semibold">{item.category_name}</TableCell>
                        <TableCell className="text-slate-700 text-xs">{item.team || 'Allgemein'}</TableCell>
                        <TableCell className="text-slate-500 text-xs truncate max-w-[120px]" title={item.purpose}>
                          {item.purpose}
                        </TableCell>
                        <TableCell className="text-right text-slate-900 font-mono text-xs font-bold">
                          CHF {item.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-[#1B255F]"
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

        {/* Right column: Receipt Preview */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Beleg-Vorschau</span>
                {selectedReceipt && (
                  <a
                    href={selectedReceipt}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#1B255F] hover:text-[#1B255F]/80 flex items-center gap-1 normal-case font-normal transition-colors"
                  >
                    Vollbild
                  </a>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {selectedReceipt ? (
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center min-h-[350px] max-h-[500px]">
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
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Info className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs">Kein Beleg ausgewählt.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="border-slate-200 bg-white text-slate-900 rounded-xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-bold text-[#1B255F] flex items-center gap-1.5">
              <XCircle className="h-5 w-5 text-rose-500" />
              Spesenbericht ablehnen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-[13px] text-slate-500">
              Bitte gib eine Begründung für die Ablehnung an. Der Nutzer erhält diese Begründung per E-Mail.
            </p>
            <div className="space-y-1.5">
              <label htmlFor="notes" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Begründung</label>
              <Textarea
                id="notes"
                placeholder="z.B. Beleg fehlt oder ist nicht lesbar..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              className="border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 bg-white shadow-sm"
            >
              Abbrechen
            </Button>
            <Button
              disabled={submitting !== null || !adminNotes.trim()}
              onClick={handleReject}
              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-md"
            >
              {submitting === 'reject' ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
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
