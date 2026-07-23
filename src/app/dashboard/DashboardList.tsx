'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteExpenseReport } from '@/app/actions/expenses'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Trash2, Eye, Loader2, AlertCircle, FileSpreadsheet, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Report {
  id: string
  created_at: string
  status: 'offen' | 'ausbezahlt' | 'abgelehnt'
  paid_at: string | null
  admin_notes: string | null
  total: number
  itemsCount: number
}

export default function DashboardList({ reports }: { reports: Report[] }) {
  const router = useRouter()
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return
    const id = reportToDelete.id

    setDeletingId(id)
    setError(null)
    const result = await deleteExpenseReport(id)
    setDeletingId(null)

    if (result.error) {
      setError(result.error)
    } else {
      setReportToDelete(null)
      router.refresh()
    }
  }

  const totalAmount = reports.reduce((sum, r) => sum + r.total, 0)
  const openReports = reports.filter(r => r.status === 'offen')
  const openAmount = openReports.reduce((sum, r) => sum + r.total, 0)
  const paidReports = reports.filter(r => r.status === 'ausbezahlt')
  const paidAmount = paidReports.reduce((sum, r) => sum + r.total, 0)

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ausbezahlt': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'in_auftrag': return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'abgelehnt': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ausbezahlt': return 'Ausbezahlt'
      case 'in_auftrag': return 'In Auftrag'
      case 'abgelehnt': return 'Abgelehnt'
      default: return 'Offen'
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-white text-slate-900 shadow-md overflow-hidden relative rounded-xl">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#1B255F]" />
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gesamt eingereicht</span>
                <p className="text-2xl font-bold text-slate-900 font-mono">CHF {totalAmount.toFixed(2)}</p>
                <p className="text-[11px] text-slate-400">{reports.length} Abrechnungen</p>
              </div>
              <div className="p-2 bg-[#1B255F]/5 rounded-lg border border-[#1B255F]/10">
                <TrendingUp className="h-5 w-5 text-[#1B255F]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-900 shadow-md overflow-hidden relative rounded-xl">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500" />
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Noch offen</span>
                <p className="text-2xl font-bold text-amber-600 font-mono">CHF {openAmount.toFixed(2)}</p>
                <p className="text-[11px] text-slate-400">{openReports.length} Abrechnungen</p>
              </div>
              <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-900 shadow-md overflow-hidden relative rounded-xl">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ausbezahlt</span>
                <p className="text-2xl font-bold text-emerald-600 font-mono">CHF {paidAmount.toFixed(2)}</p>
                <p className="text-[11px] text-slate-400">{paidReports.length} Abrechnungen</p>
              </div>
              <div className="p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-800 border border-red-200 flex items-center gap-1.5">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reports Table */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-[17px] font-bold text-[#1B255F]">Verlauf</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <FileSpreadsheet className="h-10 w-10 mx-auto text-slate-300" />
              <p className="text-[13px] font-semibold text-slate-400">Bisher keine Spesen eingereicht.</p>
              <p className="text-[11px] text-slate-400/80">Klicke oben auf &quot;Spesen einreichen&quot;, um deinen ersten Bericht zu erstellen.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider pl-6 py-4">Eingereicht am</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider py-4">Status</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider py-4">Posten</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider py-4">Ausbezahlt am</TableHead>
                    <TableHead className="text-right text-slate-500 font-semibold text-[11px] uppercase tracking-wider py-4">Gesamtbetrag</TableHead>
                    <TableHead className="w-24 text-right pr-6 py-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow
                      key={report.id}
                      onClick={() => router.push(`/dashboard/reports/${report.id}`)}
                      className="border-slate-100 hover:bg-slate-50/50 group transition-colors cursor-pointer"
                    >
                      <TableCell className="text-slate-700 font-mono text-xs pl-6 py-4">
                        {new Date(report.created_at).toLocaleDateString('de-CH')}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${getStatusBadgeClass(report.status)}`}>
                          {getStatusLabel(report.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs py-4">
                        {report.itemsCount} {report.itemsCount === 1 ? 'Beleg' : 'Belege'}
                      </TableCell>
                      <TableCell className="text-slate-500 font-mono text-xs py-4">
                        {report.paid_at ? new Date(report.paid_at).toLocaleDateString('de-CH') : '–'}
                      </TableCell>
                      <TableCell className="text-right text-slate-900 font-mono text-xs font-bold py-4">
                        CHF {report.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/dashboard/reports/${report.id}`)
                            }}
                            className="text-slate-400 hover:text-[#1B255F] hover:bg-slate-100 h-7 w-7 rounded-md"
                            title="Details anzeigen"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(report.status === 'offen' || report.status === 'abgelehnt') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deletingId === report.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                setError(null)
                                setReportToDelete(report)
                              }}
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 rounded-md transition-colors"
                              title="Löschen"
                            >
                              {deletingId === report.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Spesen Confirmation Dialog */}
      <Dialog
        open={!!reportToDelete}
        onOpenChange={(open) => {
          if (!open && !deletingId) {
            setReportToDelete(null)
            setError(null)
          }
        }}
      >
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

          {reportToDelete && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 my-1 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500 font-medium">Eingereicht am</span>
                <span className="font-mono font-semibold text-slate-800">
                  {new Date(reportToDelete.created_at).toLocaleDateString('de-CH')}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500 font-medium">Anzahl Posten</span>
                <span className="font-semibold text-slate-800">
                  {reportToDelete.itemsCount} {reportToDelete.itemsCount === 1 ? 'Beleg' : 'Belege'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
                <span className="text-slate-500 font-bold">Gesamtbetrag</span>
                <span className="font-mono font-bold text-[#1B255F] text-sm">
                  CHF {reportToDelete.total.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-800 border border-red-200 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={!!deletingId}
              onClick={() => {
                setReportToDelete(null)
                setError(null)
              }}
              className="text-xs border-slate-200 hover:bg-slate-50 h-9 rounded-lg px-4"
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!!deletingId}
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-9 rounded-lg shadow-sm px-4 gap-1.5 cursor-pointer"
            >
              {deletingId !== null ? (
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
