'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteExpenseReport } from '@/app/actions/expenses'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Trash2, Eye, Loader2, AlertCircle, FileSpreadsheet, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
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

  const totalAmount = reports.reduce((sum, r) => sum + r.total, 0)
  const openReports = reports.filter(r => r.status === 'offen')
  const openAmount = openReports.reduce((sum, r) => sum + r.total, 0)
  const paidReports = reports.filter(r => r.status === 'ausbezahlt')
  const paidAmount = paidReports.reduce((sum, r) => sum + r.total, 0)

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ausbezahlt': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'abgelehnt': return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ausbezahlt': return 'Ausbezahlt'
      case 'abgelehnt': return 'Abgelehnt'
      default: return 'Offen'
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#4B4B4B] bg-[#22307B] text-[#E5EAF7] shadow-md overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#4C6EBA]" />
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C0C0C0]">Gesamt eingereicht</span>
                <p className="text-2xl font-bold text-white font-mono">CHF {totalAmount.toFixed(2)}</p>
                <p className="text-[11px] text-[#C0C0C0]/70">{reports.length} Abrechnungen</p>
              </div>
              <div className="p-2 bg-[#4C6EBA]/10 rounded-lg border border-[#4C6EBA]/20">
                <TrendingUp className="h-5 w-5 text-[#4C6EBA]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#4B4B4B] bg-[#22307B] text-[#E5EAF7] shadow-md overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400" />
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C0C0C0]">Noch offen</span>
                <p className="text-2xl font-bold text-amber-400 font-mono">CHF {openAmount.toFixed(2)}</p>
                <p className="text-[11px] text-[#C0C0C0]/70">{openReports.length} Abrechnungen</p>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#4B4B4B] bg-[#22307B] text-[#E5EAF7] shadow-md overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400" />
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C0C0C0]">Ausbezahlt</span>
                <p className="text-2xl font-bold text-emerald-400 font-mono">CHF {paidAmount.toFixed(2)}</p>
                <p className="text-[11px] text-[#C0C0C0]/70">{paidReports.length} Abrechnungen</p>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-[13px] text-destructive-foreground border border-destructive/20 flex items-center gap-1.5">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reports Table */}
      <Card className="border-[#4B4B4B] bg-[#22307B] text-[#E5EAF7] shadow-lg">
        <CardHeader className="border-b border-[#4B4B4B]/50 pb-4">
          <CardTitle className="text-[17px] font-bold text-[#E5EAF7]">Verlauf</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <FileSpreadsheet className="h-10 w-10 mx-auto text-[#4B4B4B]" />
              <p className="text-[13px] font-semibold text-[#C0C0C0]">Bisher keine Spesen eingereicht.</p>
              <p className="text-[11px] text-[#C0C0C0]/60">Klicke oben auf &quot;Spesen einreichen&quot;, um deinen ersten Bericht zu erstellen.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-[#4B4B4B]/50">
                    <TableHead className="text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Eingereicht am</TableHead>
                    <TableHead className="text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Posten</TableHead>
                    <TableHead className="text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Ausbezahlt am</TableHead>
                    <TableHead className="text-right text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Gesamtbetrag</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="border-[#4B4B4B]/30 hover:bg-[#1B255F]/30 group transition-colors">
                      <TableCell className="text-[#E5EAF7]/80 font-mono text-xs">
                        {new Date(report.created_at).toLocaleDateString('de-CH')}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(report.status)}`}>
                          {getStatusLabel(report.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-[#C0C0C0] text-xs">
                        {report.itemsCount} {report.itemsCount === 1 ? 'Beleg' : 'Belege'}
                      </TableCell>
                      <TableCell className="text-[#C0C0C0] font-mono text-xs">
                        {report.paid_at ? new Date(report.paid_at).toLocaleDateString('de-CH') : '–'}
                      </TableCell>
                      <TableCell className="text-right text-white font-mono text-xs font-semibold">
                        CHF {report.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/dashboard/reports/${report.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-[#C0C0C0] hover:text-white hover:bg-[#4C6EBA]/15 h-7 w-7 rounded-md"
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
                              className="text-[#C0C0C0]/50 hover:text-rose-400 hover:bg-rose-500/10 h-7 w-7 rounded-md"
                              title="Löschen"
                            >
                              {deletingId === report.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
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
