'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitExpenseReport } from '@/app/actions/expenses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Plus, Loader2, ClipboardCheck, AlertCircle } from 'lucide-react'
import ReceiptUpload from './ReceiptUpload'

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

export default function ExpenseCart({ initialCategories }: { initialCategories: Category[] }) {
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

  const handleFinalSubmit = async () => {
    if (cartItems.length === 0) {
      setError('Dein Warenkorb ist leer. Bitte füge mindestens eine Spesenposition hinzu.')
      return
    }

    setSubmitting(true)
    setError(null)
    const result = await submitExpenseReport(cartItems)

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left: Form */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="border-[#4B4B4B] bg-[#22307B] text-[#E5EAF7] shadow-xl">
          <CardHeader className="border-b border-[#4B4B4B]/50 pb-4">
            <CardTitle className="text-[17px] font-bold flex items-center gap-2 text-[#E5EAF7]">
              <Plus className="h-5 w-5 text-[#4C6EBA]" />
              Spesenposition hinzufügen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleAddCurrentItem} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#C0C0C0]">Beleg (Foto/PDF)</label>
                <ReceiptUpload
                  onUploadStart={() => { setIsUploading(true); setReceiptUrl('') }}
                  onUploadComplete={(url) => { setIsUploading(false); setReceiptUrl(url) }}
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-wider text-[#C0C0C0]">Betrag (CHF)</label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={submitting}
                    className="border-[#4B4B4B] bg-[#1B255F]/50 text-white placeholder-[#C0C0C0]/50 focus:border-[#4C6EBA] focus:ring-1 focus:ring-[#4C6EBA]"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="date" className="text-[10px] font-bold uppercase tracking-wider text-[#C0C0C0]">Datum der Auslage</label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={submitting}
                    className="border-[#4B4B4B] bg-[#1B255F]/50 text-white focus:border-[#4C6EBA] focus:ring-1 focus:ring-[#4C6EBA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="category" className="text-[10px] font-bold uppercase tracking-wider text-[#C0C0C0]">Kategorie</label>
                  <Select value={categoryId} onValueChange={(val) => setCategoryId(val || '')} disabled={submitting}>
                    <SelectTrigger className="w-full border-[#4B4B4B] bg-[#1B255F]/50 text-white focus:border-[#4C6EBA] focus:ring-1 focus:ring-[#4C6EBA]">
                      <SelectValue placeholder="Kategorie wählen...">
                        {initialCategories.find(c => c.id === categoryId)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="border-[#4B4B4B] bg-[#22307B] text-[#E5EAF7]">
                      {initialCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id} className="hover:bg-[#1B255F] focus:bg-[#1B255F] cursor-pointer">
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="team" className="text-[10px] font-bold uppercase tracking-wider text-[#C0C0C0]">Team (Optional)</label>
                  <Select value={team} onValueChange={(val) => setTeam(val || '')} disabled={submitting}>
                    <SelectTrigger className="w-full border-[#4B4B4B] bg-[#1B255F]/50 text-white focus:border-[#4C6EBA] focus:ring-1 focus:ring-[#4C6EBA]">
                      <SelectValue placeholder="Kein Team">
                        {team || undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="border-[#4B4B4B] bg-[#22307B] text-[#E5EAF7]">
                      <SelectItem value="" className="hover:bg-[#1B255F] focus:bg-[#1B255F] cursor-pointer text-[#C0C0C0]">
                        Kein Team / Allgemein
                      </SelectItem>
                      {TEAMS.map((t) => (
                        <SelectItem key={t} value={t} className="hover:bg-[#1B255F] focus:bg-[#1B255F] cursor-pointer">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="purpose" className="text-[10px] font-bold uppercase tracking-wider text-[#C0C0C0]">Zweck / Beschreibung</label>
                <Input
                  id="purpose"
                  placeholder="z.B. Benzin für Auswärtsspiel vs. Aarau"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  disabled={submitting}
                  className="border-[#4B4B4B] bg-[#1B255F]/50 text-white placeholder-[#C0C0C0]/50 focus:border-[#4C6EBA] focus:ring-1 focus:ring-[#4C6EBA]"
                />
              </div>

              {formError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-[13px] text-destructive-foreground border border-destructive/20 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isUploading || submitting}
                className="w-full border border-[#4C6EBA]/40 bg-[#4C6EBA]/10 hover:bg-[#4C6EBA]/20 text-[#E5EAF7] hover:text-white transition-all"
              >
                Position hinzufügen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right: Cart summary */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="border-[#4B4B4B] bg-[#22307B] text-[#E5EAF7] shadow-xl min-h-[400px] flex flex-col justify-between">
          <div>
            <CardHeader className="border-b border-[#4B4B4B]/50 pb-4">
              <CardTitle className="text-[17px] font-bold flex items-center justify-between text-[#E5EAF7]">
                <span>Abrechnungsmappe (Warenkorb)</span>
                <span className="text-[11px] text-[#C0C0C0] font-normal">
                  {cartItems.length} {cartItems.length === 1 ? 'Posten' : 'Posten'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                  <ClipboardCheck className="h-10 w-10 text-[#4B4B4B]" />
                  <p className="text-[13px] font-semibold text-[#C0C0C0]">Dein Spesenbericht ist noch leer.</p>
                  <p className="text-[11px] text-[#C0C0C0]/60 max-w-xs">
                    Trage links deine Auslagen ein und lade Belege hoch, um den Bericht zu füllen.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-[#4B4B4B]/50">
                        <TableHead className="text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Datum</TableHead>
                        <TableHead className="text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Kategorie</TableHead>
                        <TableHead className="text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Team</TableHead>
                        <TableHead className="text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Zweck</TableHead>
                        <TableHead className="text-right text-[#C0C0C0] font-semibold text-[11px] uppercase tracking-wider">Betrag</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((item, index) => (
                        <TableRow key={index} className="border-[#4B4B4B]/30 hover:bg-[#1B255F]/30 group transition-colors">
                          <TableCell className="text-[#E5EAF7]/80 font-mono text-xs">
                            {new Date(item.date).toLocaleDateString('de-CH')}
                          </TableCell>
                          <TableCell className="text-[#E5EAF7]/80 text-xs font-medium">{item.category_name}</TableCell>
                          <TableCell className="text-[#E5EAF7]/80 text-xs">{item.team || 'Allgemein'}</TableCell>
                          <TableCell className="text-[#C0C0C0] text-xs truncate max-w-[120px]" title={item.purpose}>{item.purpose}</TableCell>
                          <TableCell className="text-right text-white font-mono text-xs font-semibold">CHF {item.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              className="text-[#C0C0C0]/40 hover:text-rose-400 hover:bg-rose-500/10 h-7 w-7 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
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
            <div className="p-6 border-t border-[#4B4B4B]/50 bg-[#1B255F]/20 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[#C0C0C0] uppercase tracking-wider text-[10px] font-bold">Gesamtbetrag</span>
                <span className="text-xl text-white font-mono font-bold">CHF {totalAmount}</span>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-[13px] text-destructive-foreground border border-destructive/20 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="w-full bg-[#4C6EBA] hover:bg-[#4C6EBA]/90 text-white font-bold py-6 text-base transition-all duration-200"
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
  )
}
