'use client'

import { useState, useTransition } from 'react'
import { updateUserRole } from '@/app/actions/profile'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Search, Shield, Copy, Check, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MemberProfile {
  id: string
  full_name: string
  email: string
  iban: string
  role: 'user' | 'admin'
}

function formatIban(iban: string): string {
  if (!iban) return '–'
  const clean = iban.replace(/\s/g, '')
  return clean.replace(/(.{4})/g, '$1 ').trim()
}

export default function AdminMembersList({ members, currentUserId }: { members: MemberProfile[]; currentUserId: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedIban, setCopiedIban] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCopyIban = (iban: string) => {
    navigator.clipboard.writeText(iban)
    setCopiedIban(iban)
    setTimeout(() => setCopiedIban(null), 2000)
  }

  const handleToggleRole = async (member: MemberProfile) => {
    if (member.id === currentUserId) {
      setError('Du kannst dir nicht selbst die Administrator-Rechte entziehen.')
      return
    }

    const newRole = member.role === 'admin' ? 'user' : 'admin'
    
    if (newRole === 'user' && !confirm(`Möchtest du ${member.full_name} wirklich die Kassier-Rechte entziehen?`)) {
      return
    }

    setError(null)
    setActionUserId(member.id)
    
    startTransition(async () => {
      const res = await updateUserRole(member.id, newRole)
      if (res.error) {
        setError(res.error)
      }
      setActionUserId(null)
    })
  }

  const filteredMembers = members.filter((m) => {
    const search = searchQuery.toLowerCase()
    return (
      m.full_name.toLowerCase().includes(search) ||
      m.email.toLowerCase().includes(search) ||
      (m.iban && m.iban.toLowerCase().includes(search))
    )
  })

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
                    <TableHead className="w-48 text-right pr-6" />
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
                                'Zum Kassier ernennen'
                              )}
                            </Button>
                          )}
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
    </div>
  )
}
