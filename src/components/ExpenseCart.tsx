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
}

export default function ExpenseCart({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  
  // Current item form state
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [purpose, setPurpose] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  
  const [isUploading, setIsUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const handleAddCurrentItem = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setFormError('Bitte gib einen gültigen Betrag ein (grösser als 0).')
      return
    }
    if (!date) {
      setFormError('Datum ist erforderlich.')
      return
    }
    if (!purpose.trim()) {
      setFormError('Zweck/Beschreibung ist erforderlich.')
      return
    }
    if (!categoryId) {
      setFormError('Bitte wähle eine Kategorie.')
      return
    }
    if (!receiptUrl) {
      setFormError('Bitte lade einen Beleg hoch.')
      return
    }

    const selectedCategory = initialCategories.find(c => c.id === categoryId)

    const newItem: CartItem = {
      amount: parseFloat(Number(amount).toFixed(2)),
      date,
      purpose: purpose.trim(),
      category_id: categoryId,
      category_name: selectedCategory ? selectedCategory.name : 'Unbekannt',
      receipt_url: receiptUrl
    }

    setCartItems([...cartItems, newItem])

    // Reset form states except date (makes consecutive entries faster)
    setAmount('')
    setPurpose('')
    setCategoryId('')
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
      {/* Left Column: Form */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" />
              Spesenposition hinzufügen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCurrentItem} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Beleg (Foto/PDF)</label>
                <ReceiptUpload
                  onUploadStart={() => {
                    setIsUploading(true)
                    setReceiptUrl('')
                  }}
                  onUploadComplete={(url) => {
                    setIsUploading(false)
                    setReceiptUrl(url)
                  }}
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Betrag (CHF)</label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={submitting}
                    className="border-slate-800 bg-slate-950/50 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="date" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Datum der Auslage</label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={submitting}
                    className="border-slate-800 bg-slate-950/50 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kategorie</label>
                <Select value={categoryId} onValueChange={(val) => setCategoryId(val || '')} disabled={submitting}>
                  <SelectTrigger className="border-slate-800 bg-slate-950/50 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="Kategorie wählen..." />
                  </SelectTrigger>
                  <SelectContent className="border-slate-800 bg-slate-900 text-white">
                    {initialCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="purpose" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Zweck / Beschreibung</label>
                <Input
                  id="purpose"
                  placeholder="z.B. Benzin für Auswärtsspiel vs. Aarau"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  disabled={submitting}
                  className="border-slate-800 bg-slate-950/50 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {formError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive-foreground border border-destructive/20 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isUploading || submitting}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all border border-slate-700"
              >
                Position hinzufügen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Cart summary */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-xl min-h-[400px] flex flex-col justify-between">
          <div>
            <CardHeader className="border-b border-slate-850 pb-4">
              <CardTitle className="text-lg font-bold flex items-center justify-between">
                <span>Abrechnungsmappe (Warenkorb)</span>
                <span className="text-xs text-slate-400 font-normal">
                  {cartItems.length} {cartItems.length === 1 ? 'Posten' : 'Posten'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 space-y-2">
                  <ClipboardCheck className="h-10 w-10 text-slate-750" />
                  <p className="text-sm font-medium">Dein Spesenbericht ist noch leer.</p>
                  <p className="text-xs max-w-xs">Trage links deine Auslagen ein und lade Belege hoch, um den Bericht zu füllen.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="border-slate-850">
                      <TableRow className="hover:bg-transparent border-slate-850">
                        <TableHead className="text-slate-400 font-medium">Datum</TableHead>
                        <TableHead className="text-slate-400 font-medium">Kategorie</TableHead>
                        <TableHead className="text-slate-400 font-medium">Zweck</TableHead>
                        <TableHead className="text-right text-slate-400 font-medium">Betrag</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((item, index) => (
                        <TableRow key={index} className="border-slate-850 hover:bg-slate-900/20 group">
                          <TableCell className="text-slate-300 font-mono text-xs">
                            {new Date(item.date).toLocaleDateString('de-CH')}
                          </TableCell>
                          <TableCell className="text-slate-300 text-xs font-medium">{item.category_name}</TableCell>
                          <TableCell className="text-slate-350 text-xs truncate max-w-[150px]">{item.purpose}</TableCell>
                          <TableCell className="text-right text-white font-mono text-xs">CHF {item.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
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

          {/* Footer & Finalize submit */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-slate-850 bg-slate-950/20 space-y-4">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-400 uppercase tracking-wider text-xs">Gesamtbetrag</span>
                <span className="text-xl text-white font-mono">CHF {totalAmount}</span>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive-foreground border border-destructive/20 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-6 text-base transition-all duration-200"
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
