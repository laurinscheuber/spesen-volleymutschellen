'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, AlertCircle } from 'lucide-react'
import { deleteExpenseReport } from '@/app/actions/expenses'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteReportButtonProps {
  reportId: string
  itemsCount?: number
  totalAmount?: string
  createdAt?: string
}

export default function DeleteReportButton({
  reportId,
  itemsCount,
  totalAmount,
  createdAt,
}: DeleteReportButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    setError(null)

    const result = await deleteExpenseReport(reportId)

    if (result.error) {
      setError(result.error)
      setIsDeleting(false)
    } else {
      setIsOpen(false)
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setError(null)
          setIsOpen(true)
        }}
        className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 h-9 px-4 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Bericht löschen
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isDeleting) setIsOpen(false) }}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 text-slate-900">
          <DialogHeader className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 border border-red-100 text-red-600 shrink-0">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-slate-900">
                Spesenbericht löschen?
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 leading-relaxed">
                Möchtest du diesen Spesenbericht wirklich löschen? Alle Belege dieser Abrechnung werden unwiderruflich gelöscht.
              </DialogDescription>
            </div>
          </DialogHeader>

          {(createdAt || itemsCount !== undefined || totalAmount) && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 my-1 text-xs">
              {createdAt && (
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-500 font-medium">Eingereicht am</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {new Date(createdAt).toLocaleDateString('de-CH')}
                  </span>
                </div>
              )}
              {itemsCount !== undefined && (
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-500 font-medium">Anzahl Posten</span>
                  <span className="font-semibold text-slate-800">
                    {itemsCount} {itemsCount === 1 ? 'Beleg' : 'Belege'}
                  </span>
                </div>
              )}
              {totalAmount && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
                  <span className="text-slate-500 font-bold">Gesamtbetrag</span>
                  <span className="font-mono font-bold text-[#1B255F] text-sm">
                    CHF {totalAmount}
                  </span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-800 border border-red-200 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setIsOpen(false)}
              className="text-xs border-slate-200 hover:bg-slate-50 h-9 rounded-lg px-4"
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-9 rounded-lg shadow-sm px-4 gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Wird gelöscht...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Bericht löschen</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
