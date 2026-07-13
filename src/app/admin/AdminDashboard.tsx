'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eye, Download, ClipboardList, Wallet, FileDown } from 'lucide-react'
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
        <Card className="border-[#4B4B4B] bg-[#22307B] text-[#E5EAF7] shadow-md overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#4C6EBA]" />
          <CardContent className="pt-5 pb-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C0C0C0]">Ausstehende Auszahlungen</span>
              <p className="text-3xl font-bold text-white font-mono">CHF {totalOpenAmount.toFixed(2)}</p>
              <p className="text-[11px] text-[#C0C0C0]/70">{reports.length} offene Abrechnungsmappen</p>
            </div>
            <div className="p-3 bg-[#4C6EBA]/10 text-[#4C6EBA] rounded-xl border border-[#4C6EBA]/20">
              <Wallet className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#4B4B4B] bg-[#22307B] text-[#E5EAF7] shadow-md">
          <CardHeader className="pb-3 border-b border-[#4B4B4B]/50">
            <CardTitle className="text-[11px] font-bold text-[#C0C0C0] uppercase tracking-wider flex items-center gap-1.5">
              <FileDown className="h-4 w-4 text-[#4C6EBA]" />
              Webling Spesen-Export
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#C0C0C0] uppercase tracking-wider">Von</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 border-[#4B4B4B] bg-[#1B255F]/50 text-[#E5EAF7] text-xs focus:border-[#4C6EBA] focus:ring-1 focus:ring-[#4C6EBA]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#C0C0C0] uppercase tracking-wider">Bis</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 border-[#4B4B4B] bg-[#1B255F]/50 text-[#E5EAF7] text-xs focus:border-[#4C6EBA] focus:ring-1 focus:ring-[#4C6EBA]"
                />
              </div>
            </div>
            <a
              href={`/api/export-webling?start=${startDate}&end=${endDate}`}
              download
              className={cn(
                buttonVariants({ variant: 'default' }),
                'w-full bg-[#4C6EBA] hover:bg-[#4C6EBA]/90 text-white font-semibold text-xs h-9 transition-colors gap-2 flex items-center justify-center rounded-lg cursor-pointer'
              )}
            >
              <Download className="h-4 w-4" />
              Ausbezahlte Spesen exportieren (CSV)
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Open Reports Table */}
      <Card className="border-[#4B4B4B] bg-[#22307B] text-[#E5EAF7] shadow-lg">
        <CardHeader className="border-b border-[#4B4B4B]/50 pb-4">
          <CardTitle className="text-[17px] font-bold flex items-center gap-2 text-[#E5EAF7]">
            <ClipboardList className="h-5 w-5 text-[#4C6EBA]" />
            Offene Abrechnungen prüfen
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <ClipboardList className="h-10 w-10 mx-auto text-[#4B4B4B]" />
              <p className="text-[13px] font-semibold text-[#C0C0C0]">Keine offenen Spesenberichte vorhanden.</p>
              <p className="text-[11px] text-[#C0C0C0]/60">Alle eingereichten Spesen wurden bereits bearbeitet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-[#4B4B4B]/50">
                    <TableHead className="text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Eingereicht am</TableHead>
                    <TableHead className="text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Mitglied</TableHead>
                    <TableHead className="text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Posten</TableHead>
                    <TableHead className="text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">IBAN</TableHead>
                    <TableHead className="text-right text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Betrag</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="border-[#4B4B4B]/30 hover:bg-[#1B255F]/30 group transition-colors">
                      <TableCell className="text-[#E5EAF7]/70 font-mono text-xs">
                        {new Date(report.created_at).toLocaleDateString('de-CH')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-[#E5EAF7] text-xs font-semibold">{report.user_name}</p>
                          <p className="text-[#C0C0C0] text-[10px]">{report.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#C0C0C0] text-xs">
                        {report.itemsCount} {report.itemsCount === 1 ? 'Beleg' : 'Belege'}
                      </TableCell>
                      <TableCell className="text-[#C0C0C0] font-mono text-[10px]">
                        {report.iban}
                      </TableCell>
                      <TableCell className="text-right text-white font-mono text-xs font-bold">
                        CHF {report.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/reports/${report.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-[#C0C0C0] hover:text-white hover:bg-[#4C6EBA]/15 h-7 w-7 rounded-md"
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
