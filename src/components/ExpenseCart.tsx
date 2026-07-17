'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitExpenseReport } from '@/app/actions/expenses'
import { createMemberProfile } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Plus, Loader2, ClipboardCheck, AlertCircle, UserPlus, Users } from 'lucide-react'
import ReceiptUpload from './ReceiptUpload'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface Category {
  id: string
  name: string
}

interface CartItem {
  amount: number
  date: string
  purpose: string
  category_id: string
  category_name: string
  receipt_url: string
  team?: string
}

interface Member {
  id: string
  full_name: string
  email: string | null
  iban: string
}

export default function ExpenseCart({ 
  initialCategories,
  members = [],
  isAdmin = false
}: { 
  initialCategories: Category[]
  members?: Member[]
  isAdmin?: boolean
}) {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [purpose, setPurpose] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [team, setTeam] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')

  const [isUploading, setIsUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Admin / Submitting on behalf of others states
  const [submitForOther, setSubmitForOther] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [membersList, setMembersList] = useState<Member[]>(members)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberIban, setNewMemberIban] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [modalError, setModalError] = useState<string | null>(null)
  const [savingNewMember, setSavingNewMember] = useState(false)

  const TEAMS = [
    'Damen 1', 'Damen 2', 'Damen 3', 'Damen Ü32',
    'Herren 1', 'Herren 2', 'Herren 3',
    'Mixed',
    'Juniorinnen 1 (U23)', 'Juniorinnen 2 (U23)', 'Juniorinnen 3 (U20)', 'Juniorinnen 4 (U18)', 'Juniorinnen 5 (U16)',
    'Junioren 1 (U23)', 'Junioren 2 (U16)',
    'Rookies (U14)', 'Kids'
  ]

  const handleAddCurrentItem = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setFormError('Bitte gib einen gültigen Betrag ein (grösser als 0).')
      return
    }
    if (!date) { setFormError('Datum ist erforderlich.'); return }
    if (!purpose.trim()) { setFormError('Zweck/Beschreibung ist erforderlich.'); return }
    if (!categoryId) { setFormError('Bitte wähle eine Kategorie.'); return }
    if (!receiptUrl) { setFormError('Bitte lade einen Beleg hoch.'); return }

    const selectedCategory = initialCategories.find(c => c.id === categoryId)

    setCartItems([...cartItems, {
      amount: parseFloat(Number(amount).toFixed(2)),
      date,
      purpose: purpose.trim(),
      category_id: categoryId,
      category_name: selectedCategory ? selectedCategory.name : 'Unbekannt',
      receipt_url: receiptUrl,
      team: team || undefined
    }])

    setAmount('')
    setPurpose('')
    setCategoryId('')
    setTeam('')
    setReceiptUrl('')
  }

  const handleRemoveItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index))
  }

  const handleCreateNewMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)
    
    if (!newMemberName.trim()) {
      setModalError('Bitte gib einen Namen ein.')
      return
    }
    
    const cleanIban = newMemberIban.replace(/\s+/g, '').toUpperCase()
    if (cleanIban.length < 15) {
      setModalError('Ungültiges IBAN-Format. Mindestens 15 Zeichen erforderlich.')
      return
    }

    setSavingNewMember(true)
    const result = await createMemberProfile({
      fullName: newMemberName.trim(),
      iban: cleanIban,
      email: newMemberEmail.trim() || undefined
    })

    if (result.error) {
      setModalError(result.error)
      setSavingNewMember(false)
    } else if (result.member) {
      const addedMember = {
        id: result.member.id,
        full_name: result.member.full_name,
        email: result.member.email,
        iban: result.member.iban
      }
      setMembersList([...membersList, addedMember].sort((a, b) => a.full_name.localeCompare(b.full_name)))
      setSelectedUserId(result.member.id)
      
      // Reset form and close modal
      setNewMemberName('')
      setNewMemberIban('')
      setNewMemberEmail('')
      setSavingNewMember(false)
      setIsModalOpen(false)
    }
  }

  const handleFinalSubmit = async () => {
    if (cartItems.length === 0) {
      setError('Dein Warenkorb ist leer. Bitte füge mindestens eine Spesenposition hinzu.')
      return
    }

    if (submitForOther && !selectedUserId) {
      setError('Bitte wähle eine Person aus, für die diese Spesen erfasst werden.')
      return
    }

    setSubmitting(true)
    setError(null)
    const result = await submitExpenseReport(cartItems, submitForOther ? selectedUserId : undefined)

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)

  return (
    <div className="space-y-6">
      {/* Admin Toggle Section */}
      {isAdmin && (
        <Card className="border-slate-200 bg-white text-slate-900 shadow-sm rounded-xl">
          <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Spesen für eine andere Person erfassen</p>
                <p className="text-xs text-slate-500">Erfasse Abrechnungen direkt für ein anderes Vereinsmitglied.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant={submitForOther ? 'default' : 'outline'}
                onClick={() => {
                  setSubmitForOther(!submitForOther)
                  if (!submitForOther && membersList.length > 0 && !selectedUserId) {
                    setSelectedUserId(membersList[0].id)
                  }
                }}
                className={submitForOther 
                  ? "bg-[#1B255F] hover:bg-[#1B255F]/90 text-white font-bold text-xs shadow-sm border-0" 
                  : "border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
                }
              >
                {submitForOther ? 'Für mich erfassen' : 'Für jemand anderen erfassen'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* If submitForOther is true, show User selector row */}
      {submitForOther && isAdmin && (
        <Card className="border-slate-200 bg-white text-slate-900 shadow-sm rounded-xl border-l-4 border-l-indigo-600 animate-in fade-in slide-in-from-top-2 duration-200">
          <CardContent className="p-5 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
            <div className="w-full sm:max-w-md space-y-2">
              <label htmlFor="member-select" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Person auswählen</label>
              <Select value={selectedUserId} onValueChange={(val) => setSelectedUserId(val || '')}>
                <SelectTrigger id="member-select" className="w-full border-slate-200 bg-white text-slate-900 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]">
                  <SelectValue placeholder="Mitglied wählen...">
                    {membersList.find(m => m.id === selectedUserId) 
                      ? `${membersList.find(m => m.id === selectedUserId)?.full_name} (${membersList.find(m => m.id === selectedUserId)?.email || 'Keine E-Mail'})`
                      : 'Mitglied wählen...'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white text-slate-900 max-h-60 overflow-y-auto">
                  {membersList.map((member) => (
                    <SelectItem key={member.id} value={member.id} className="hover:bg-slate-50 focus:bg-slate-50 cursor-pointer text-slate-900">
                      {member.full_name} {member.email ? `(${member.email})` : '(Keine E-Mail)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold shadow-sm transition-all text-xs flex items-center gap-1.5 shrink-0"
            >
              <UserPlus className="h-4 w-4 text-slate-600" />
              <span>Neue Person hinzufügen</span>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left: Form */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-[17px] font-bold flex items-center gap-2 text-[#1B255F]">
              <Plus className="h-5 w-5 text-[#1B255F]" />
              Spesenposition hinzufügen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleAddCurrentItem} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Beleg (Foto/PDF)</label>
                <ReceiptUpload
                  onUploadStart={() => { setIsUploading(true); setReceiptUrl('') }}
                  onUploadComplete={(url) => { setIsUploading(false); setReceiptUrl(url) }}
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Betrag (CHF)</label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={submitting}
                    className="border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="date" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Datum der Auslage</label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={submitting}
                    className="border-slate-200 bg-white text-slate-900 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="category" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Kategorie</label>
                  <Select value={categoryId} onValueChange={(val) => setCategoryId(val || '')} disabled={submitting}>
                    <SelectTrigger className="w-full border-slate-200 bg-white text-slate-900 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]">
                      <SelectValue placeholder="Kategorie wählen...">
                        {initialCategories.find(c => c.id === categoryId)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white text-slate-900">
                      {initialCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id} className="hover:bg-slate-50 focus:bg-slate-50 cursor-pointer text-slate-900">
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="team" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Team (Optional)</label>
                  <Select value={team} onValueChange={(val) => setTeam(val || '')} disabled={submitting}>
                    <SelectTrigger className="w-full border-slate-200 bg-white text-slate-900 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]">
                      <SelectValue placeholder="Kein Team">
                        {team || undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white text-slate-900">
                      <SelectItem value="" className="hover:bg-slate-50 focus:bg-slate-50 cursor-pointer text-slate-400">
                        Kein Team / Allgemein
                      </SelectItem>
                      {TEAMS.map((t) => (
                        <SelectItem key={t} value={t} className="hover:bg-slate-50 focus:bg-slate-50 cursor-pointer text-slate-900">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="purpose" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Zweck / Beschreibung</label>
                <Input
                  id="purpose"
                  placeholder="z.B. Benzin für Auswärtsspiel vs. Aarau"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  disabled={submitting}
                  className="border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
                />
              </div>

              {formError && (
                <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-800 border border-red-200 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isUploading || submitting}
                className="w-full border border-slate-200 bg-white hover:bg-slate-50 text-[#1B255F] font-bold shadow-sm transition-all"
              >
                Position hinzufügen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right: Cart summary */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="border-slate-200 bg-white text-slate-900 shadow-md min-h-[400px] flex flex-col justify-between rounded-xl">
          <div>
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-[17px] font-bold flex items-center justify-between text-[#1B255F]">
                <span>Abrechnungsmappe (Warenkorb)</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {cartItems.length} {cartItems.length === 1 ? 'Posten' : 'Posten'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                  <ClipboardCheck className="h-10 w-10 text-slate-300" />
                  <p className="text-[13px] font-semibold text-slate-400">Dein Spesenbericht ist noch leer.</p>
                  <p className="text-[11px] text-slate-400/80 max-w-xs">
                    Trage links deine Auslagen ein und lade Belege hoch, um den Bericht zu füllen.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Datum</TableHead>
                        <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Kategorie</TableHead>
                        <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Team</TableHead>
                        <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Zweck</TableHead>
                        <TableHead className="text-right text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Betrag</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((item, index) => (
                        <TableRow key={index} className="border-slate-100 hover:bg-slate-50/50 group transition-colors">
                          <TableCell className="text-slate-700 font-mono text-xs">
                            {new Date(item.date).toLocaleDateString('de-CH')}
                          </TableCell>
                          <TableCell className="text-slate-700 text-xs font-medium">{item.category_name}</TableCell>
                          <TableCell className="text-slate-700 text-xs">{item.team || 'Allgemein'}</TableCell>
                          <TableCell className="text-slate-500 text-xs truncate max-w-[120px]" title={item.purpose}>{item.purpose}</TableCell>
                          <TableCell className="text-right text-slate-900 font-mono text-xs font-bold">CHF {item.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
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
              <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Gesamtbetrag</span>
                <span className="text-xl text-slate-900 font-mono font-bold">CHF {totalAmount}</span>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-800 border border-red-200 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="w-full bg-[#1B255F] hover:bg-[#1B255F]/90 text-white font-bold py-6 text-base transition-all duration-200 rounded-lg shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Übermittle Abrechnung...
                  </>
                ) : (
                  'Spesenbericht jetzt einreichen'
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>

    {/* New Member Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl shadow-xl p-6 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B255F] flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#1B255F]" />
              Neues Mitglied erfassen
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Erstelle ein Profil für ein Vereinsmitglied, um Spesen für diese Person einzureichen. Die E-Mail ist optional.
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
                disabled={savingNewMember}
                className="border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="modal-iban" className="text-[10px] font-bold uppercase tracking-wider text-slate-600">IBAN</label>
              <Input
                id="modal-iban"
                placeholder="CH93 0000 0000 0000 0000 0"
                value={newMemberIban}
                onChange={(e) => setNewMemberIban(e.target.value)}
                disabled={savingNewMember}
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
                disabled={savingNewMember}
                className="border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
              />
            </div>

            {modalError && (
              <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-800 border border-red-200 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsModalOpen(false)
                  setModalError(null)
                }}
                disabled={savingNewMember}
                className="text-xs text-slate-500 hover:bg-slate-50 font-semibold"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={savingNewMember}
                className="bg-[#1B255F] hover:bg-[#1B255F]/90 text-white font-bold text-xs px-4"
              >
                {savingNewMember ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  'Speichern'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
