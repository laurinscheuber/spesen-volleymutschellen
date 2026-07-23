'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createHistoricalExpenseReport } from '@/app/actions/expenses'
import { createMemberProfile } from '@/app/actions/profile'
import ReceiptUpload from '@/components/ReceiptUpload'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  ChevronLeft,
  History,
  UserPlus,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Calendar,
  CreditCard,
} from 'lucide-react'

interface ProfileOption {
  id: string
  full_name: string
  email: string
  iban: string
}

interface CategoryOption {
  id: string
  name: string
}

interface Item {
  amount: number
  date: string
  purpose: string
  category_id: string
  category_name: string
  receipt_url: string
  team?: string
}

const TEAMS = [
  'Damen 1', 'Damen 2', 'Damen 3', 'Damen Ü32',
  'Herren 1', 'Herren 2', 'Herren 3',
  'Mixed',
  'Juniorinnen 1 (U23)', 'Juniorinnen 2 (U23)', 'Juniorinnen 3 (U20)', 'Juniorinnen 4 (U18)', 'Juniorinnen 5 (U16)',
  'Junioren 1 (U23)', 'Junioren 2 (U16)',
  'Rookies (U14)', 'Kids'
]

export default function HistoricalExpenseForm({
  profiles: initialProfiles,
  categories,
}: {
  profiles: ProfileOption[]
  categories: CategoryOption[]
}) {
  const router = useRouter()
  const [profiles, setProfiles] = useState<ProfileOption[]>(initialProfiles)
  const [targetUserId, setTargetUserId] = useState<string>(initialProfiles[0]?.id || '')

  // Metadata States
  const [createdAt, setCreatedAt] = useState(() => new Date().toISOString().split('T')[0])
  const [paidAt, setPaidAt] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [paidAtManuallyEdited, setPaidAtManuallyEdited] = useState(false)

  const handleCreatedAtChange = (val: string) => {
    setCreatedAt(val)
    if (!paidAtManuallyEdited && val) {
      const d = new Date(val)
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + 1)
        setPaidAt(d.toISOString().split('T')[0])
      }
    }
  }

  const handlePaidAtChange = (val: string) => {
    setPaidAt(val)
    setPaidAtManuallyEdited(true)
  }
  const [status, setStatus] = useState<'ausbezahlt' | 'in_auftrag' | 'offen' | 'abgelehnt'>('ausbezahlt')
  const [adminNotes, setAdminNotes] = useState('')

  // Item Form States
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [purpose, setPurpose] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [team, setTeam] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // Cart & Submitting States
  const [cartItems, setCartItems] = useState<Item[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // New Member Modal States
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberIban, setNewMemberIban] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [savingMember, setSavingMember] = useState(false)
  const [memberModalError, setMemberModalError] = useState<string | null>(null)

  const handleAddCurrentItem = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const numAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Bitte gib einen gültigen Betrag grösser als 0 ein.')
      return
    }
    if (!date) {
      setFormError('Bitte wähle ein Datum für die Auslage aus.')
      return
    }
    if (!purpose.trim()) {
      setFormError('Bitte gib den Verwendungszweck an.')
      return
    }
    if (!categoryId) {
      setFormError('Bitte wähle eine Kategorie aus.')
      return
    }

    const selectedCategory = categories.find((c) => c.id === categoryId)

    const newItem: Item = {
      amount: numAmount,
      date,
      purpose: purpose.trim(),
      category_id: categoryId,
      category_name: selectedCategory?.name || 'Unbekannt',
      receipt_url: receiptUrl,
      team: team || undefined,
    }

    setCartItems((prev) => [...prev, newItem])
    setAmount('')
    setPurpose('')
    setReceiptUrl('')
  }

  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreateNewMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setMemberModalError(null)

    if (!newMemberName.trim()) {
      setMemberModalError('Bitte gib den Vor- & Nachnamen des Mitglieds ein.')
      return
    }

    setSavingMember(true)
    const result = await createMemberProfile({
      fullName: newMemberName.trim(),
      iban: newMemberIban.trim(),
      email: newMemberEmail.trim(),
    })
    setSavingMember(false)

    if (result.error) {
      setMemberModalError(result.error)
    } else if (result.member) {
      const newProfile: ProfileOption = {
        id: result.member.id,
        full_name: result.member.full_name,
        email: result.member.email || '',
        iban: result.member.iban || '',
      }
      setProfiles((prev) => [...prev, newProfile].sort((a, b) => a.full_name.localeCompare(b.full_name)))
      setTargetUserId(newProfile.id)
      setIsMemberModalOpen(false)
      setNewMemberName('')
      setNewMemberIban('')
      setNewMemberEmail('')
    }
  }

  const handleSubmitHistoricalReport = async () => {
    if (cartItems.length === 0) {
      setSubmitError('Füge mindestens eine Position zur Spesenabrechnung hinzu.')
      return
    }
    if (!targetUserId) {
      setSubmitError('Bitte wähle ein Mitglied aus.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    const result = await createHistoricalExpenseReport({
      targetUserId,
      createdAt,
      paidAt: status === 'ausbezahlt' ? (paidAt || createdAt) : undefined,
      status,
      adminNotes: adminNotes.trim() || undefined,
      items: cartItems.map((item) => ({
        amount: item.amount,
        date: item.date,
        purpose: item.purpose,
        category_id: item.category_id,
        receipt_url: item.receipt_url,
        team: item.team,
      })),
    })

    setSubmitting(false)

    if (result.error) {
      setSubmitError(result.error)
    } else {
      router.push('/admin/archive')
      router.refresh()
    }
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link href="/admin">
          <Button variant="ghost" className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 pl-0 gap-1 h-9 rounded-lg">
            <ChevronLeft className="h-4 w-4" />
            Zurück zur Admin-Übersicht
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black uppercase tracking-wider text-[#1B255F] flex items-center gap-2.5">
            <History className="h-7 w-7 text-[#1B255F]" />
            Historische Spese nacherfassen
          </h1>
          <p className="text-xs text-slate-500">
            Erfasse vergangene Abrechnungen direkt für das Archiv und Statistiken. Es werden keine E-Mails versendet.
          </p>
        </div>
      </div>

      {/* Configuration Card */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#1B255F]">
            1. Mitglied & Stammdaten
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
          {/* Member Selection */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Mitglied</label>
            <div className="flex items-center gap-2">
              <Select value={targetUserId} onValueChange={(val) => val && setTargetUserId(val)}>
                <SelectTrigger className="w-full border-slate-200 bg-white text-slate-900 h-9 font-semibold text-xs rounded-lg">
                  <SelectValue placeholder="Mitglied auswählen">
                    {profiles.find((p) => p.id === targetUserId)?.full_name || 'Mitglied auswählen'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 max-h-60">
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.full_name} {p.email ? `(${p.email})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMemberModalOpen(true)}
                className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-9 px-3 shrink-0 text-xs font-bold rounded-lg"
                title="Neues Mitglied erfassen"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Status</label>
            <Select value={status} onValueChange={(val: any) => setStatus(val)}>
              <SelectTrigger className="w-full border-slate-200 bg-white text-slate-900 h-9 font-semibold text-xs rounded-lg">
                <SelectValue placeholder="Status wählen" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="ausbezahlt" className="text-xs text-emerald-700 font-bold">Ausbezahlt (Standard Archiv)</SelectItem>
                <SelectItem value="in_auftrag" className="text-xs text-sky-700 font-bold">Zahlung erfasst (In Auftrag)</SelectItem>
                <SelectItem value="offen" className="text-xs text-amber-700 font-bold">Offen</SelectItem>
                <SelectItem value="abgelehnt" className="text-xs text-red-700 font-bold">Abgelehnt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Einreichdatum */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Einreichdatum (Historisch)</label>
            <Input
              type="date"
              value={createdAt}
              onChange={(e) => handleCreatedAtChange(e.target.value)}
              className="border-slate-200 bg-white text-slate-900 h-9 text-xs rounded-lg"
            />
          </div>

          {/* Auszahlungsdatum */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Auszahlungsdatum (Historisch)</label>
            <Input
              type="date"
              value={paidAt}
              onChange={(e) => handlePaidAtChange(e.target.value)}
              disabled={status !== 'ausbezahlt'}
              className="border-slate-200 bg-white text-slate-900 h-9 text-xs rounded-lg disabled:opacity-50"
            />
          </div>

          {/* Admin Notes */}
          <div className="md:col-span-12 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Notiz / Bemerkung (Optional)</label>
            <Textarea
              placeholder="z.B. Nacherfassung der Saison 2024/2025 aus Papierbelegen..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              className="border-slate-200 bg-white text-slate-900 text-xs rounded-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Item Form & Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Item Entry Form */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#1B255F]">
                2. Spesenposition hinzufügen
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <form onSubmit={handleAddCurrentItem} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Betrag (CHF)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">CHF</span>
                    <Input
                      id="amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-12 border-slate-200 bg-white text-slate-900 font-mono text-sm font-bold h-9 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="date" className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Datum der Auslage</label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border-slate-200 bg-white text-slate-900 text-xs h-9 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="category" className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Kategorie</label>
                  <Select value={categoryId} onValueChange={(val) => val && setCategoryId(val)}>
                    <SelectTrigger id="category" className="w-full border-slate-200 bg-white text-slate-900 text-xs h-9 rounded-lg">
                      <SelectValue placeholder="Kategorie wählen">
                        {categories.find((c) => c.id === categoryId)?.name || 'Kategorie wählen'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="team" className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Team (Optional)</label>
                  <Select value={team} onValueChange={(val) => setTeam(val || '')}>
                    <SelectTrigger id="team" className="w-full border-slate-200 bg-white text-slate-900 text-xs h-9 rounded-lg">
                      <SelectValue placeholder="Kein Team / Allgemein">
                        {team || 'Kein Team / Allgemein'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 max-h-60">
                      <SelectItem value="" className="text-xs text-slate-400">
                        Kein Team / Allgemein
                      </SelectItem>
                      {TEAMS.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="purpose" className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Zweck / Beschreibung</label>
                  <Input
                    id="purpose"
                    placeholder="z.B. Hallenmiete oder Bälle Kaufen"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="border-slate-200 bg-white text-slate-900 text-xs h-9 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Beleg / Quittung (Optional bei Altspesen)</label>
                  <ReceiptUpload
                    value={receiptUrl}
                    disabled={isUploading}
                    onUploadStart={() => setIsUploading(true)}
                    onUploadComplete={(url) => {
                      setIsUploading(false)
                      setReceiptUrl(url)
                    }}
                  />
                </div>

                {formError && (
                  <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-200 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-[#1B255F] hover:bg-[#1B255F]/90 text-white font-bold h-9 text-xs rounded-lg shadow-sm gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Position hinzufügen</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: Cart Summary & Submit */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-200 bg-white text-slate-900 shadow-md min-h-[400px] flex flex-col justify-between rounded-xl">
            <div>
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#1B255F] flex items-center justify-between">
                  <span>3. Erfasste Positionen ({cartItems.length})</span>
                  <span className="font-mono text-sm font-bold text-slate-900">Total: CHF {totalAmount}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {cartItems.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <History className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="text-xs">Noch keine Positionen hinzugefügt.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-slate-100">
                          <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider pl-6 py-4">Datum</TableHead>
                          <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider py-4">Kategorie</TableHead>
                          <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider py-4">Team</TableHead>
                          <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider py-4">Zweck</TableHead>
                          <TableHead className="text-right text-slate-500 font-semibold text-[11px] uppercase tracking-wider py-4">Betrag</TableHead>
                          <TableHead className="w-12 pr-6 py-4 text-right" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cartItems.map((item, idx) => (
                          <TableRow key={idx} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <TableCell className="text-slate-700 font-mono text-xs pl-6 py-4">
                              {new Date(item.date).toLocaleDateString('de-CH')}
                            </TableCell>
                            <TableCell className="text-slate-800 text-xs font-semibold py-4">{item.category_name}</TableCell>
                            <TableCell className="text-slate-700 text-xs py-4">{item.team || 'Allgemein'}</TableCell>
                            <TableCell className="text-slate-500 text-xs truncate max-w-[120px] py-4" title={item.purpose}>
                              {item.purpose}
                            </TableCell>
                            <TableCell className="text-right text-slate-900 font-mono text-xs font-bold py-4">
                              CHF {item.amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right pr-6 py-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(idx)}
                                className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4 rounded-b-xl">
                {submitError && (
                  <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-200 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <Button
                  onClick={handleSubmitHistoricalReport}
                  disabled={submitting}
                  className="w-full bg-[#1B255F] hover:bg-[#1B255F]/90 text-white font-bold py-6 text-base rounded-lg shadow-md cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Speichere im Archiv...
                    </>
                  ) : (
                    'Historische Spese im Archiv speichern'
                  )}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* New Member Dialog */}
      <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl shadow-xl p-6 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B255F] flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#1B255F]" />
              Neues historisches Mitglied erfassen
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Erstelle ein Profil für ein ehemaliges oder bestehendes Vereinsmitglied, um Spesen zuzuordnen.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNewMember} className="space-y-4 pt-3">
            <div className="space-y-2">
              <label htmlFor="modal-name" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Vor- & Nachname</label>
              <Input
                id="modal-name"
                placeholder="z.B. Max Mustermann"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                disabled={savingMember}
                className="border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="modal-iban" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">IBAN (Optional)</label>
              <Input
                id="modal-iban"
                placeholder="CH93 0000 0000 0000 0000 0"
                value={newMemberIban}
                onChange={(e) => setNewMemberIban(e.target.value)}
                disabled={savingMember}
                className="border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="modal-email" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">E-Mail (Optional)</label>
              <Input
                id="modal-email"
                type="email"
                placeholder="z.B. max@example.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                disabled={savingMember}
                className="border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
              />
            </div>

            {memberModalError && (
              <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-800 border border-red-200 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span>{memberModalError}</span>
              </div>
            )}

            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsMemberModalOpen(false)}
                disabled={savingMember}
                className="text-xs text-slate-500 font-semibold"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={savingMember}
                className="bg-[#1B255F] hover:bg-[#1B255F]/90 text-white font-bold text-xs px-4"
              >
                {savingMember ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  'Mitglied speichern'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
