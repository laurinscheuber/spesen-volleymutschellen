'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eye, Download, ClipboardList, Wallet, FileDown, MoreVertical, Play } from 'lucide-react'
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
  DialogFooter,
} from '@/components/ui/dialog'

interface OpenReport {
  id: string
  created_at: string
  status: string
  user_name: string
  user_email: string
  iban: string
  total: number
  itemsCount: number
}

function formatIban(iban: string): string {
  const clean = iban.replace(/\s/g, '')
  return clean.replace(/(.{4})/g, '$1 ').trim()
}

export default function AdminDashboard({ reports }: { reports: OpenReport[] }) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  const totalOpenAmount = reports.reduce((sum, r) => sum + r.total, 0)

  return (
    <div className="space-y-6">
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
              <p className="text-3xl font-black text-slate-900 font-mono leading-none pt-0.5">CHF {totalOpenAmount.toFixed(2)}</p>
              <p className="text-[11px] text-slate-400">{reports.length} offene Abrechnungsmappen</p>
            </div>
          </div>
          {reports.length > 0 && (
            <Link href={`/admin/reports/${reports[0].id}?queue=true`}>
              <Button className="bg-[#1B255F] hover:bg-[#1B255F]/90 text-white font-bold px-6 py-5 rounded-lg shadow-md gap-2 transition-all w-full sm:w-auto">
                <Play className="h-4 w-4 fill-current text-white" />
                Warteschlange starten
              </Button>
            </Link>
          )}
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

      {/* Open Reports Table */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
        <CardHeader className="border-b border-slate-100 pb-4 flex flex-row justify-between items-center">
          <CardTitle className="text-[17px] font-bold flex items-center gap-2 text-[#1B255F]">
            <ClipboardList className="h-5 w-5 text-[#1B255F]" />
            Spesenübersicht
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                <MoreVertical className="h-4 w-4" />
              </Button>
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
        </CardHeader>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <ClipboardList className="h-10 w-10 mx-auto text-slate-300" />
              <p className="text-[13px] font-semibold text-slate-400">Keine offenen Spesenberichte vorhanden.</p>
              <p className="text-[11px] text-slate-400/80">Alle eingereichten Spesen wurden bereits bearbeitet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Eingereicht am</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Mitglied</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Posten</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">IBAN</TableHead>
                    <TableHead className="text-right text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Betrag</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="border-slate-100 hover:bg-slate-50/50 group transition-colors">
                      <TableCell className="text-slate-700 font-mono text-xs">
                        {new Date(report.created_at).toLocaleDateString('de-CH')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-slate-900 text-xs font-semibold">{report.user_name}</p>
                          <p className="text-slate-400 text-[10px]">{report.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {report.itemsCount} {report.itemsCount === 1 ? 'Beleg' : 'Belege'}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border",
                          report.status === 'in_auftrag'
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {report.status === 'in_auftrag' ? 'In Auftrag' : 'Offen'}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-700 font-mono text-[10.5px]">
                        {formatIban(report.iban)}
                      </TableCell>
                      <TableCell className="text-right text-slate-900 font-mono text-xs font-bold">
                        CHF {report.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/reports/${report.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-[#1B255F] hover:bg-slate-50 h-7 w-7 rounded-md"
                            title="Prüfen & Auszahlen"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
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
