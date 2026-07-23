'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { updateUserRole } from '@/app/actions/profile'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Search, Shield, Copy, Check, Loader2, AlertCircle, History, Eye } from 'lucide-react'
import { cn, formatSwissDate } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface MemberProfile {
  id: string
  full_name: string
  email: string
  iban: string
  role: 'user' | 'admin'
}

interface ReportItem {
  id: string
  created_at: string
  status: 'offen' | 'ausbezahlt' | 'abgelehnt'
  total: number
  user_id: string
}

function formatIban(iban: string): string {
  if (!iban) return '–'
  const clean = iban.replace(/\s/g, '')
  return clean.replace(/(.{4})/g, '$1 ').trim()
}

export default function AdminMembersList({ 
  members, 
  reports,
  currentUserId 
}: { 
  members: MemberProfile[]
  reports: ReportItem[]
  currentUserId: string 
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedIban, setCopiedIban] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Member History Modal State
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null)
  const [roleMemberToDemote, setRoleMemberToDemote] = useState<MemberProfile | null>(null)

  const handleCopyIban = (iban: string) => {
    navigator.clipboard.writeText(iban)
    setCopiedIban(iban)
    setTimeout(() => setCopiedIban(null), 2000)
  }

  const executeRoleChange = (member: MemberProfile, newRole: 'user' | 'admin') => {
    setError(null)
    setActionUserId(member.id)
    
    startTransition(async () => {
      const res = await updateUserRole(member.id, newRole)
      if (res.error) {
        setError(res.error)
      } else {
        setRoleMemberToDemote(null)
      }
      setActionUserId(null)
    })
  }

  const handleToggleRole = (member: MemberProfile) => {
    if (member.id === currentUserId) {
      setError('Du kannst dir nicht selbst die Administrator-Rechte entziehen.')
      return
    }

    if (member.role === 'admin') {
      setRoleMemberToDemote(member)
      return
    }

    executeRoleChange(member, 'admin')
  }

  const handleOpenHistory = (member: MemberProfile) => {
    setSelectedMember(member)
    setHistoryOpen(true)
  }

  const filteredMembers = members.filter((m) => {
    const search = searchQuery.toLowerCase()
    return (
      m.full_name.toLowerCase().includes(search) ||
      m.email.toLowerCase().includes(search) ||
      (m.iban && m.iban.toLowerCase().includes(search))
    )
  })

  // Filtered reports list for the selected member
  const memberReports = useMemo(() => {
    if (!selectedMember) return []
    return reports.filter((r) => r.user_id === selectedMember.id)
  }, [reports, selectedMember])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ausbezahlt':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-200">
            Ausbezahlt
          </span>
        )
      case 'in_auftrag':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border bg-sky-50 text-sky-800 border-sky-200">
            Erfasst
          </span>
        )
      case 'offen':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border bg-amber-50 text-amber-800 border-amber-200">
            Offen
          </span>
        )
      case 'abgelehnt':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border bg-rose-50 text-rose-800 border-rose-200">
            Abgelehnt
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-[13px] text-red-800 border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Mitglieder suchen (Name, E-Mail, IBAN)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 border-slate-200 bg-white text-slate-900 text-xs focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F] rounded-lg"
          />
        </div>
        <div className="text-[11px] text-slate-400 text-right flex items-center justify-end gap-1">
          <span>{filteredMembers.length} {filteredMembers.length === 1 ? 'Mitglied' : 'Mitglieder'}</span>
        </div>
      </div>

      <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
        <CardContent className="p-0">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Search className="h-10 w-10 mx-auto text-slate-300" />
              <p className="text-[13px] font-semibold text-slate-400">Keine Mitglieder gefunden.</p>
              <p className="text-[11px] text-slate-400/80">Passe deine Suche an oder überprüfe die Schreibweise.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider pl-6">Mitglied</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Rolle</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">IBAN</TableHead>
                    <TableHead className="w-56 text-right pr-6" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const isSelf = member.id === currentUserId
                    const hasIban = !!member.iban
                    
                    return (
                      <TableRow key={member.id} className="border-slate-100 hover:bg-slate-50/50 group transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div>
                            <p className="text-slate-900 text-xs font-semibold">
                              {member.full_name || 'Unbekannter Name'}
                              {isSelf && <span className="ml-1.5 text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-normal">Du</span>}
                            </p>
                            <p className="text-slate-400 text-[10px]">{member.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border",
                            member.role === 'admin' 
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          )}>
                            {member.role === 'admin' ? (
                              <>
                                <Shield className="h-3 w-3 text-indigo-600" />
                                Kassier
                              </>
                            ) : (
                              'Mitglied'
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {hasIban ? (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-700 font-semibold">{formatIban(member.iban)}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyIban(member.iban)}
                                className="h-6 w-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                                title="IBAN kopieren"
                              >
                                {copiedIban === member.iban ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-red-500 font-semibold bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                              Keine IBAN erfasst
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenHistory(member)}
                              className="text-xs font-semibold h-8 rounded-md px-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 gap-1 flex items-center"
                              title="Spesenverlauf anzeigen"
                            >
                              <History className="h-3.5 w-3.5" />
                              <span>Verlauf</span>
                            </Button>

                            {!isSelf && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isPending && actionUserId === member.id}
                                onClick={() => handleToggleRole(member)}
                                className={cn(
                                  "text-xs font-semibold h-8 rounded-md px-3",
                                  member.role === 'admin' 
                                    ? "text-red-600 hover:text-red-700 hover:bg-red-50" 
                                    : "text-[#1B255F] hover:text-[#1B255F] hover:bg-slate-50"
                                )}
                              >
                                {isPending && actionUserId === member.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : member.role === 'admin' ? (
                                  'Rechte entziehen'
                                ) : (
                                  'Kassier ernennen'
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member History Modal */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xl p-6 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B255F] flex items-center gap-2">
              <History className="h-5 w-5 text-[#1B255F]" />
              Spesenverlauf: {selectedMember?.full_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Gesamthistorie aller eingereichten Spesenberichte dieses Mitglieds.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {memberReports.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Dieses Mitglied hat noch keine Spesenberichte eingereicht.
              </div>
            ) : (
              <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                <div className="max-h-96 overflow-y-auto pr-1">
                  <table className="w-full text-xs text-slate-700">
                    <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                      <tr>
                        <th className="text-left text-slate-500 font-bold uppercase tracking-wider pl-4 py-3 text-[10px]">Datum</th>
                        <th className="text-left text-slate-500 font-bold uppercase tracking-wider py-3 text-[10px]">Bericht ID</th>
                        <th className="text-left text-slate-500 font-bold uppercase tracking-wider py-3 text-[10px]">Betrag</th>
                        <th className="text-left text-slate-500 font-bold uppercase tracking-wider py-3 text-[10px]">Status</th>
                        <th className="w-16 py-3 text-right pr-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {memberReports.map((report) => (
                        <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="pl-4 py-3 font-mono text-slate-600">
                            {formatSwissDate(report.created_at)}
                          </td>
                          <td className="py-3 font-mono text-slate-500">
                            {report.id.substring(0, 8)}...
                          </td>
                          <td className="py-3 font-mono font-bold text-slate-900">
                            CHF {report.total.toFixed(2)}
                          </td>
                          <td className="py-3">
                            {getStatusBadge(report.status)}
                          </td>
                          <td className="py-3 text-right pr-6">
                            <Link href={`/admin/reports/${report.id}`} onClick={() => setHistoryOpen(false)}>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Demote Kassier Confirmation Dialog */}
      <Dialog
        open={!!roleMemberToDemote}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            setRoleMemberToDemote(null)
          }
        }}
      >
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 text-slate-900">
          <DialogHeader className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 border border-amber-100 text-amber-600 shrink-0">
              <Shield className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-slate-900">
                Kassier-Rechte entziehen?
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 leading-relaxed">
                Möchtest du <span className="font-semibold text-slate-800">{roleMemberToDemote?.full_name}</span> wirklich die Administrator- / Kassier-Rechte entziehen?
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setRoleMemberToDemote(null)}
              className="text-xs border-slate-200 hover:bg-slate-50 h-9 rounded-lg px-4"
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => roleMemberToDemote && executeRoleChange(roleMemberToDemote, 'user')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9 rounded-lg shadow-sm px-4 gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Wird geändert...</span>
                </>
              ) : (
                <span>Rechte entziehen</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
