'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteExpenseReport } from '@/app/actions/expenses'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Trash2, Eye, Loader2, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Möchtest du diesen Spesenbericht wirklich löschen? Alle Belege dieser Abrechnung werden gelöscht.')) {
      return
    }

    setDeletingId(id)
    setError(null)
    const result = await deleteExpenseReport(id)
    setDeletingId(null)

    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  // Stats
  const totalAmount = reports.reduce((sum, r) => sum + r.total, 0)
  const openReports = reports.filter(r => r.status === 'offen')
  const openAmount = openReports.reduce((sum, r) => sum + r.total, 0)
  const paidReports = reports.filter(r => r.status === 'ausbezahlt')
  const paidAmount = paidReports.reduce((sum, r) => sum + r.total, 0)

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ausbezahlt':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'abgelehnt':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ausbezahlt':
        return 'Ausbezahlt'
      case 'abgelehnt':
        return 'Abgelehnt'
      default:
        return 'Offen'
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gesamt eingereicht</span>
              <span className="text-2xl font-mono text-white mt-1">CHF {totalAmount.toFixed(2)}</span>
              <span className="text-xs text-slate-550 mt-2">{reports.length} Abrechnungen</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Noch offen</span>
              <span className="text-2xl font-mono text-amber-400 mt-1">CHF {openAmount.toFixed(2)}</span>
              <span className="text-xs text-slate-550 mt-2">{openReports.length} Abrechnungen</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ausbezahlt</span>
              <span className="text-2xl font-mono text-emerald-400 mt-1">CHF {paidAmount.toFixed(2)}</span>
              <span className="text-xs text-slate-550 mt-2">{paidReports.length} Abrechnungen</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive-foreground border border-destructive/20 flex items-center gap-1.5">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* History table */}
      <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Verlauf</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <FileSpreadsheet className="h-10 w-10 mx-auto text-slate-700" />
              <p className="text-sm font-medium">Bisher keine Spesen eingereicht.</p>
              <p className="text-xs">Klicke oben auf &quot;Spesen einreichen&quot;, um deinen ersten Bericht zu erstellen.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-slate-850">
                  <TableRow className="hover:bg-transparent border-slate-850">
                    <TableHead className="text-slate-400 font-medium">Eingereicht am</TableHead>
                    <TableHead className="text-slate-400 font-medium">Status</TableHead>
                    <TableHead className="text-slate-400 font-medium">Posten</TableHead>
                    <TableHead className="text-slate-400 font-medium">Ausbezahlt am</TableHead>
                    <TableHead className="text-right text-slate-400 font-medium">Gesamtbetrag</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="border-slate-850 hover:bg-slate-900/20 group">
                      <TableCell className="text-slate-300 font-mono text-xs">
                        {new Date(report.created_at).toLocaleDateString('de-CH')}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadgeClass(report.status)}`}>
                          {getStatusLabel(report.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-350 text-xs">
                        {report.itemsCount} {report.itemsCount === 1 ? 'Beleg' : 'Belege'}
                      </TableCell>
                      <TableCell className="text-slate-350 font-mono text-xs">
                        {report.paid_at
                          ? new Date(report.paid_at).toLocaleDateString('de-CH')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right text-white font-mono text-xs">
                        CHF {report.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/dashboard/reports/${report.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-white hover:bg-slate-900/50 h-7 w-7 rounded-md"
                              title="Details anzeigen"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          {report.status === 'offen' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deletingId === report.id}
                              onClick={() => handleDelete(report.id)}
                              className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 rounded-md"
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
    </div>
  )
}
