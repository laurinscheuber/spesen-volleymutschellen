'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateReportStatus, deleteExpenseReport } from '@/app/actions/expenses'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, Calendar, User, Copy, Check, CheckCircle2, XCircle, Loader2, Info, Eye, ClipboardList, Play, Trash2, AlertCircle, X, MoreVertical } from 'lucide-react'

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
  status: 'offen' | 'in_auftrag' | 'ausbezahlt' | 'abgelehnt'
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

export default function AdminReportDetail({
  report,
  queueIndex,
  queueTotal,
  nextReportId,
}: {
  report: ReportDetails
  queueIndex?: number
  queueTotal?: number
  nextReportId: string | null
}) {
  const router = useRouter()
  const [selectedReceipt, setSelectedReceipt] = useState<string>(report.items[0]?.receipt_url || '')
  const [copied, setCopied] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [submitting, setSubmitting] = useState<'in_auftrag' | 'payout' | 'reject' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCopyIban = () => {
    navigator.clipboard.writeText(report.iban)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTransition = () => {
    if (queueIndex !== undefined) {
      if (nextReportId) {
        router.push(`/admin/reports/${nextReportId}?queue=true`)
        router.refresh()
      } else {
        router.push('/admin?queue_done=true')
        router.refresh()
      }
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  const handleSetInAuftrag = async () => {
    setSubmitting('in_auftrag')
    setError(null)
    const result = await updateReportStatus(report.id, 'in_auftrag')
    if (result.error) {
      setError(result.error)
      setSubmitting(null)
    } else {
      handleTransition()
    }
  }

  const handleApprove = async () => {
    setSubmitting('payout')
    setError(null)
    const result = await updateReportStatus(report.id, 'ausbezahlt')
    if (result.error) {
      setError(result.error)
      setSubmitting(null)
    } else {
      handleTransition()
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
      handleTransition()
    }
  }

  const handleConfirmDeleteReport = async () => {
    setSubmitting('delete')
    setError(null)
    const result = await deleteExpenseReport(report.id)
    if (result.error) {
      setError(result.error)
      setSubmitting(null)
    } else {
      setDeleteDialogOpen(false)
      router.push('/admin')
      router.refresh()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ausbezahlt':
        return (
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-[11px] font-bold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
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
            Offen
          </div>
        )
    }
  }

  const isPdf = selectedReceipt.toLowerCase().split('?')[0].endsWith('.pdf')

  return (
    <div className="space-y-6">
      {queueIndex !== undefined && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-sky-800 font-bold">
            <Play className="h-4 w-4 fill-current text-sky-600 animate-pulse shrink-0" />
            <span>Spesen-Warteschlange aktiv: Abrechnungsmappe {queueIndex} von {queueTotal}</span>
          </div>
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-xs text-sky-700 hover:text-sky-800 hover:bg-sky-100/60 h-8 rounded-lg gap-1 font-bold">
              Warteschlange beenden
            </Button>
          </Link>
        </div>
      )}

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
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black uppercase tracking-wider text-[#1B255F]">Spesenabrechnung prüfen</h1>
            {getStatusBadge(report.status)}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Bericht ID: {report.id}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {report.status === 'offen' && (
            <>
              <Button
                variant="outline"
                disabled={submitting !== null}
                onClick={() => setRejectDialogOpen(true)}
                title="Spese ablehnen"
                className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 h-10 w-10 p-0 rounded-lg transition-colors shadow-sm flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>

              <Button
                disabled={submitting !== null}
                onClick={handleSetInAuftrag}
                className="bg-[#1B255F] hover:bg-[#1B255F]/90 text-white h-10 px-4 rounded-lg font-semibold shadow-md gap-1.5 flex items-center cursor-pointer"
              >
                {submitting === 'in_auftrag' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                )}
                <span>Zahlung erfasst</span>
              </Button>
            </>
          )}

          {report.status === 'in_auftrag' && (
            <>
              <span className="text-xs text-slate-500 hidden md:inline">Zahlung erfasst. Freigabe erfolgt automatisch in 24h.</span>
              <Button
                disabled={submitting !== null}
                onClick={handleApprove}
                className="bg-emerald-600 hover:bg-emerald-500 text-white h-10 px-4 rounded-lg font-semibold shadow-md gap-1.5 flex items-center cursor-pointer"
              >
                {submitting === 'payout' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-white" />
                )}
                <span>Sofort ausbezahlen</span>
              </Button>
            </>
          )}

          {/* 3-Dots Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={submitting !== null}
              className="inline-flex items-center justify-center h-10 w-10 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer shrink-0 shadow-sm transition-colors"
              title="Weitere Optionen"
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1">
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium text-xs rounded-lg cursor-pointer flex items-center gap-2 p-2"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
                <span>Spese löschen</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
                      <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider pl-6 py-4">Datum</TableHead>
                      <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider py-4">Kategorie</TableHead>
                      <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider py-4">Team</TableHead>
                      <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider py-4">Zweck</TableHead>
                      <TableHead className="text-right text-slate-500 font-semibold text-[11px] uppercase tracking-wider py-4">Betrag</TableHead>
                      <TableHead className="w-16 pr-6 py-4 text-right" />
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
                        <TableCell className="text-slate-700 font-mono text-xs pl-6 py-4">
                          {new Date(item.date).toLocaleDateString('de-CH')}
                        </TableCell>
                        <TableCell className="text-slate-800 text-xs font-semibold py-4">{item.category_name}</TableCell>
                        <TableCell className="text-slate-700 text-xs py-4">{item.team || 'Allgemein'}</TableCell>
                        <TableCell className="text-slate-500 text-xs truncate max-w-[140px] py-4" title={item.purpose}>
                          {item.purpose}
                        </TableCell>
                        <TableCell className="text-right text-slate-900 font-mono text-xs font-bold py-4">
                          CHF {item.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right pr-6 py-4">
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

      {/* Delete Report Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { if (!open && submitting !== 'delete') setDeleteDialogOpen(false) }}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 text-slate-900">
          <DialogHeader className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 border border-red-100 text-red-600 shrink-0">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-slate-900">
                Spese löschen?
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 leading-relaxed">
                Möchtest du diese Spesenabrechnung wirklich löschen? Alle Belege dieser Abrechnung werden unwiderruflich gelöscht.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 my-1 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="text-slate-500 font-medium">Mitglied</span>
              <span className="font-semibold text-slate-800">{report.user_name}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="text-slate-500 font-medium">Eingereicht am</span>
              <span className="font-mono font-semibold text-slate-800">
                {new Date(report.created_at).toLocaleDateString('de-CH')}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
              <span className="text-slate-500 font-bold">Gesamtbetrag</span>
              <span className="font-mono font-bold text-[#1B255F] text-sm">
                CHF {report.total.toFixed(2)}
              </span>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting === 'delete'}
              onClick={() => setDeleteDialogOpen(false)}
              className="text-xs border-slate-200 hover:bg-slate-50 h-9 rounded-lg px-4"
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={submitting === 'delete'}
              onClick={handleConfirmDeleteReport}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-9 rounded-lg shadow-sm px-4 gap-1.5 cursor-pointer"
            >
              {submitting === 'delete' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Wird gelöscht...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Spese löschen</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
