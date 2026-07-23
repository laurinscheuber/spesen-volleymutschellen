'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteExpenseReport } from '@/app/actions/expenses'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Eye, Search, Filter, X, Calendar, Wallet, Trash2, AlertCircle, Loader2, History } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormattedReport {
  id: string
  created_at: string
  status: string
  paid_at: string | null
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

export default function AdminArchiveList({
  reports,
  categories,
}: {
  reports: FormattedReport[]
  categories: CategoryOption[]
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [visibleCount, setVisibleCount] = useState(25)

  // Delete Dialog States
  const [reportToDelete, setReportToDelete] = useState<FormattedReport | null>(null)
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

  // Extract all unique teams dynamically from data
  const uniqueTeams = useMemo(() => {
    const teams = reports.flatMap((r) => r.teams)
    return Array.from(new Set(teams)).filter(Boolean).sort()
  }, [reports])

  const handleResetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setCategoryFilter('all')
    setTeamFilter('all')
    setStartDate('')
    setEndDate('')
    setVisibleCount(25)
  }

  // Filter reports on client side
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
      if (statusFilter !== 'all' && report.status !== statusFilter) {
        return false
      }

      // 3. Category Filter
      if (categoryFilter !== 'all' && !report.categories.includes(categoryFilter)) {
        return false
      }

      // 4. Team Filter
      if (teamFilter !== 'all' && !report.teams.includes(teamFilter)) {
        return false
      }

      // 5. Date Range Filter (Von)
      if (startDate) {
        const reportDate = new Date(report.created_at).toISOString().split('T')[0]
        if (reportDate < startDate) return false
      }

      // 6. Date Range Filter (Bis)
      if (endDate) {
        const reportDate = new Date(report.created_at).toISOString().split('T')[0]
        if (reportDate > endDate) return false
      }

      return true
    })
  }, [reports, searchQuery, statusFilter, categoryFilter, teamFilter, startDate, endDate])

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
      {/* Search & Filters Controls */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
        <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-[#1B255F]" />
            Filter & Suche
          </CardTitle>
          <div className="flex items-center gap-2">
            {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || teamFilter !== 'all' || startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg gap-1 font-bold px-2.5"
              >
                <X className="h-3 w-3" />
                Zurücksetzen
              </Button>
            )}
            <Link href="/admin/historical/new">
              <Button size="sm" variant="outline" className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold h-8 rounded-lg gap-1.5 text-xs shadow-sm">
                <History className="h-3.5 w-3.5 text-[#1B255F]" />
                <span>Altspesen nacherfassen</span>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Text Search */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Schnellsuche</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Name, Zweck, ID..."
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
                <SelectTrigger className="h-9 border-slate-200 text-xs bg-white">
                  <SelectValue placeholder="Alle Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="all" className="text-xs">Alle Status</SelectItem>
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
                <SelectTrigger className="h-9 border-slate-200 text-xs bg-white">
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
                <SelectTrigger className="h-9 border-slate-200 text-xs bg-white">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
            {/* Start Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Eingereicht ab (Von)
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 border-slate-200 bg-white text-slate-900 text-xs focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Eingereicht bis (Bis)
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 border-slate-200 bg-white text-slate-900 text-xs focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
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
                      Keine Abrechnungen gefunden, die den Filtern entsprechen.
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
