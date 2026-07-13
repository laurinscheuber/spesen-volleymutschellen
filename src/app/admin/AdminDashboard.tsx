'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eye, Download, Users, ClipboardList, Wallet, FileDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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

export default function AdminDashboard({ reports }: { reports: OpenReport[] }) {
  // Webling Export Date Range (default to current month)
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  
  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(lastDay)

  const totalOpenAmount = reports.reduce((sum, r) => sum + r.total, 0)

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-md">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ausstehende Auszahlungen</span>
              <p className="text-3xl font-mono font-bold text-white">CHF {totalOpenAmount.toFixed(2)}</p>
              <p className="text-xs text-slate-500">{reports.length} offene Abrechnungsmappen</p>
            </div>
            <div className="p-3 bg-blue-600/10 text-blue-400 rounded-full border border-blue-500/15">
              <Wallet className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Webling Export Options */}
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
              <FileDown className="h-4 w-4 text-blue-400" />
              Webling Spesen-Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Von</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 border-slate-800 bg-slate-950/50 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Bis</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 border-slate-800 bg-slate-950/50 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <a
              href={`/api/export-webling?start=${startDate}&end=${endDate}`}
              download
              className={cn(
                buttonVariants({ variant: 'default' }),
                "w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs h-9 transition-colors gap-2 flex items-center justify-center rounded-lg cursor-pointer"
              )}
            >
              <Download className="h-4 w-4" />
              Ausbezahlte Spesen exportieren (CSV)
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Open Reports Table */}
      <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-500" />
            Offene Abrechnungen prüfen
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <Users className="h-10 w-10 mx-auto text-slate-700" />
              <p className="text-sm font-medium">Keine offenen Spesenberichte vorhanden.</p>
              <p className="text-xs">Alle eingereichten Spesen wurden bereits bearbeitet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-slate-850">
                  <TableRow className="hover:bg-transparent border-slate-850">
                    <TableHead className="text-slate-400 font-medium">Eingereicht am</TableHead>
                    <TableHead className="text-slate-400 font-medium">Mitglied</TableHead>
                    <TableHead className="text-slate-400 font-medium">Posten</TableHead>
                    <TableHead className="text-slate-400 font-medium">IBAN</TableHead>
                    <TableHead className="text-right text-slate-400 font-medium">Betrag</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="border-slate-850 hover:bg-slate-900/20 group">
                      <TableCell className="text-slate-355 font-mono text-xs">
                        {new Date(report.created_at).toLocaleDateString('de-CH')}
                      </TableCell>
                      <TableCell className="text-slate-200 text-xs font-semibold">
                        {report.user_name}
                      </TableCell>
                      <TableCell className="text-slate-350 text-xs">
                        {report.itemsCount} {report.itemsCount === 1 ? 'Beleg' : 'Belege'}
                      </TableCell>
                      <TableCell className="text-slate-400 font-mono text-[10px]">
                        {report.iban}
                      </TableCell>
                      <TableCell className="text-right text-white font-mono text-xs font-semibold">
                        CHF {report.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/reports/${report.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-white hover:bg-slate-900/50 h-7 w-7 rounded-md"
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
