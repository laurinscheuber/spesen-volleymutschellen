'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { deleteExpenseReport } from '@/app/actions/expenses'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eye, Download, ClipboardList, Wallet, FileDown, MoreVertical, Play, CheckCircle2, Search, Filter, X, Trash2, AlertCircle, Loader2, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Report {
  id: string
  created_at: string
  status: string
  user_name: string
  user_email: string
  iban: string
  total: number
  itemsCount: number
  categories: string[]
  purposes: string[]
  teams: string[]
}

interface CategoryOption {
  id: string
  name: string
}

function formatIban(iban: string): string {
  const clean = iban.replace(/\s/g, '')
  return clean.replace(/(.{4})/g, '$1 ').trim()
}

export default function AdminDashboard({
  reports,
  categories,
}: {
  reports: Report[]
  categories: CategoryOption[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queueDone = searchParams.get('queue_done') === 'true'

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all') // Default to all (Alle Abrechnungen)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [visibleCount, setVisibleCount] = useState(25)

  // Delete Dialog States
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return
    const id = reportToDelete.id
    setDeletingId(id)
    setDeleteError(null)

    const result = await deleteExpenseReport(id)
    setDeletingId(null)

    if (result.error) {
      setDeleteError(result.error)
    } else {
      setReportToDelete(null)
      router.refresh()
    }
  }

  // Export Dialog States
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  // Extract unique teams dynamically
  const uniqueTeams = useMemo(() => {
    const teams = reports.flatMap((r) => r.teams)
    return Array.from(new Set(teams)).filter(Boolean).sort()
  }, [reports])

  // KPIs (Only outstanding reports)
  const outstandingReports = useMemo(() => {
    return reports.filter((r) => r.status === 'offen' || r.status === 'in_auftrag')
  }, [reports])

  const totalOutstandingAmount = useMemo(() => {
    return outstandingReports.reduce((sum, r) => sum + r.total, 0)
  }, [outstandingReports])

  // Queue reports (Sorted FIFO: oldest first)
  const queueReports = useMemo(() => {
    return [...outstandingReports].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [outstandingReports])

  const handleResetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setCategoryFilter('all')
    setTeamFilter('all')
    setVisibleCount(25)
  }

  // Filtered reports list
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchName = report.user_name.toLowerCase().includes(query)
        const matchEmail = report.user_email.toLowerCase().includes(query)
        const matchId = report.id.toLowerCase().includes(query)
        const matchPurpose = report.purposes.some((p) => p.toLowerCase().includes(query))
        const matchCategory = report.categories.some((c) => c.toLowerCase().includes(query))

        if (!matchName && !matchEmail && !matchId && !matchPurpose && !matchCategory) {
          return false
        }
      }

      // 2. Status Filter
      if (statusFilter === 'pending') {
        if (report.status !== 'offen' && report.status !== 'in_auftrag') return false
      } else if (statusFilter !== 'all') {
        if (report.status !== statusFilter) return false
      }

      // 3. Category Filter
      if (categoryFilter !== 'all' && !report.categories.includes(categoryFilter)) {
        return false
      }

      // 4. Team Filter
      if (teamFilter !== 'all' && !report.teams.includes(teamFilter)) {
        return false
      }

      return true
    })
  }, [reports, searchQuery, statusFilter, categoryFilter, teamFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ausbezahlt':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-200">
            Ausbezahlt
          </span>
        )
      case 'in_auftrag':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-sky-50 text-sky-800 border-sky-200">
            Zahlung erfasst
          </span>
        )
      case 'offen':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-amber-50 text-amber-800 border-amber-200">
            Offen
          </span>
        )
      case 'abgelehnt':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-rose-50 text-rose-800 border-rose-200">
            Abgelehnt
          </span>
        )
      default:
        return null
    }
  }

  const reportsToShow = filteredReports.slice(0, visibleCount)

  return (
    <div className="space-y-6">
      {queueDone && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-800 text-xs font-semibold shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>Warteschlange beendet! Alle ausstehenden Spesen wurden erfolgreich geprüft.</span>
        </div>
      )}
      
      {/* Overview Stats & Quick Queue Action */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-md overflow-hidden relative rounded-xl">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#1B255F]" />
        <CardContent className="pt-5 pb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#1B255F]/5 text-[#1B255F] rounded-xl border border-[#1B255F]/10">
              <Wallet className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ausstehende Auszahlungen</span>
              <p className="text-3xl font-black text-slate-900 font-mono leading-none pt-0.5">
                CHF {totalOutstandingAmount.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-400">
                {outstandingReports.length} offene Mappen zur Freigabe
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {queueReports.length > 0 && (
              <Link href={`/admin/reports/${queueReports[0].id}?queue=true`}>
                <Button className="bg-[#1B255F] hover:bg-[#1B255F]/90 text-white font-bold px-5 py-5 rounded-lg shadow-md gap-2 transition-all w-full sm:w-auto text-xs cursor-pointer">
                  <Play className="h-4 w-4 fill-current text-white" />
                  Warteschlange starten
                </Button>
              </Link>
            )}

            <Link href="/admin/historical/new">
              <Button variant="outline" className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-5 rounded-lg shadow-sm gap-2 transition-all w-full sm:w-auto text-xs cursor-pointer">
                <History className="h-4 w-4 text-[#1B255F]" />
                Altspesen nacherfassen
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Webling CSV Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl shadow-xl p-6 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B255F] flex items-center gap-2">
              <FileDown className="h-5 w-5 text-[#1B255F]" />
              Webling Spesen-Export
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-xs text-slate-500">
              Wähle den Zeitraum für den Export der ausbezahlten Spesenberichte aus.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Von</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 border-slate-200 bg-white text-slate-900 text-xs focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Bis</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 border-slate-200 bg-white text-slate-900 text-xs focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setExportDialogOpen(false)}
              className="text-xs border-slate-200 hover:bg-slate-50 h-9 rounded-lg"
            >
              Abbrechen
            </Button>
            <a
              href={`/api/export-webling?start=${startDate}&end=${endDate}`}
              onClick={() => setExportDialogOpen(false)}
              download
              className={cn(
                buttonVariants({ variant: 'default' }),
                'bg-[#1B255F] hover:bg-[#1B255F]/90 text-white font-semibold text-xs h-9 transition-colors gap-2 flex items-center justify-center rounded-lg cursor-pointer shadow-sm px-4'
              )}
            >
              <Download className="h-3.5 w-3.5" />
              Herunterladen (CSV)
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Reports Table and Search Interface */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
        <CardHeader className="border-b border-slate-100 pb-4 flex flex-row justify-between items-center">
          <CardTitle className="text-[17px] font-bold flex items-center gap-2 text-[#1B255F]">
            <ClipboardList className="h-5 w-5 text-[#1B255F]" />
            Spesenübersicht
          </CardTitle>
          <div className="flex items-center gap-2">
            {(searchQuery || statusFilter !== 'pending' || categoryFilter !== 'all' || teamFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg gap-1 font-bold px-2.5"
              >
                <X className="h-3.5 w-3.5" />
                Filter zurücksetzen
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg flex items-center justify-center cursor-pointer">
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-lg rounded-lg text-slate-700">
                <DropdownMenuItem 
                  onClick={() => setExportDialogOpen(true)}
                  className="hover:bg-slate-50 text-xs font-semibold cursor-pointer py-2 px-3 gap-2 flex items-center"
                >
                  <Download className="h-3.5 w-3.5" />
                  Webling CSV-Export
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        {/* Filter Toolbar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quick Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Suche</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Mitglied, Zweck, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-xs focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Status</label>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
              <SelectTrigger className="h-9 border-slate-200 text-xs bg-white w-full">
                <SelectValue placeholder="Ausstehend" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="pending" className="text-xs">Ausstehende Spesen</SelectItem>
                <SelectItem value="all" className="text-xs">Alle Abrechnungen</SelectItem>
                <SelectItem value="offen" className="text-xs">Offen</SelectItem>
                <SelectItem value="in_auftrag" className="text-xs">Zahlung erfasst</SelectItem>
                <SelectItem value="ausbezahlt" className="text-xs">Ausbezahlt</SelectItem>
                <SelectItem value="abgelehnt" className="text-xs">Abgelehnt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Kategorie</label>
            <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || 'all')}>
              <SelectTrigger className="h-9 border-slate-200 text-xs bg-white w-full">
                <SelectValue placeholder="Alle Kategorien" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-xs">Alle Kategorien</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name} className="text-xs">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Team / Ressort</label>
            <Select value={teamFilter} onValueChange={(val) => setTeamFilter(val || 'all')}>
              <SelectTrigger className="h-9 border-slate-200 text-xs bg-white w-full">
                <SelectValue placeholder="Alle Teams" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-xs">Alle Teams</SelectItem>
                {uniqueTeams.map((team) => (
                  <SelectItem key={team} value={team} className="text-xs">
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider pl-6 py-4">Datum</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Mitglied</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Verwendung & Details</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Betrag</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Status</TableHead>
                  <TableHead className="w-24 text-right text-slate-500 font-semibold text-[11px] uppercase tracking-wider pr-6">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportsToShow.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                      Keine Abrechnungen gefunden.
                    </TableCell>
                  </TableRow>
                ) : (
                  reportsToShow.map((report) => (
                    <TableRow
                      key={report.id}
                      onClick={() => router.push(`/admin/reports/${report.id}`)}
                      className="border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <TableCell className="text-slate-600 text-xs pl-6 py-4 font-mono">
                        {new Date(report.created_at).toLocaleDateString('de-CH')}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="font-semibold text-slate-800 text-[13px]">{report.user_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono leading-none pt-0.5">{report.id.substring(0, 8)}...</div>
                      </TableCell>
                      <TableCell className="py-4 max-w-xs">
                        <div className="text-slate-700 text-xs font-medium truncate">
                          {report.purposes.join(', ') || 'Kein Verwendungszweck'}
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {report.teams.map((team) => (
                            <span key={team} className="inline-flex px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                              {team}
                            </span>
                          ))}
                          {report.categories.map((cat) => (
                            <span key={cat} className="inline-flex px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-semibold border border-blue-100">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-900 font-bold font-mono text-[13px] py-4">
                        CHF {report.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-4">
                        {getStatusBadge(report.status)}
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/reports/${report.id}`)
                            }}
                            className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            title="Details anzeigen"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deletingId === report.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteError(null)
                              setReportToDelete(report)
                            }}
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Löschen"
                          >
                            {deletingId === report.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination/Load More */}
          {filteredReports.length > visibleCount && (
            <div className="p-4 border-t border-slate-100 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((prev) => prev + 25)}
                className="text-xs text-[#1B255F] border-slate-200 hover:bg-slate-50 font-bold h-9 rounded-lg"
              >
                Mehr anzeigen ({filteredReports.length - visibleCount} verbleibend)
              </Button>
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
            setDeleteError(null)
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
                <span className="text-slate-500 font-medium">Mitglied</span>
                <span className="font-semibold text-slate-800">{reportToDelete.user_name}</span>
              </div>
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

          {deleteError && (
            <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-800 border border-red-200 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={!!deletingId}
              onClick={() => {
                setReportToDelete(null)
                setDeleteError(null)
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
