'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCategory, toggleCategoryActive, deleteCategory } from '@/app/actions/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Loader2, AlertCircle, Eye, EyeOff, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Category {
  id: string
  name: string
  is_active: boolean
  itemsCount: number
}

export default function CategoryList({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Deletion Modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [mergeCategoryId, setMergeCategoryId] = useState<string>('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)
    const result = await createCategory(name)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setName('')
      router.refresh()
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setTogglingId(id)
    setError(null)
    const result = await toggleCategoryActive(id, currentStatus)
    setTogglingId(null)

    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    // Pre-select first available other category
    const otherActive = categories.find((c) => c.id !== category.id && c.is_active)
    setMergeCategoryId(otherActive?.id || '')
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return
    setDeletingId(categoryToDelete.id)
    setError(null)

    const result = await deleteCategory(
      categoryToDelete.id, 
      categoryToDelete.itemsCount > 0 ? mergeCategoryId : undefined
    )
    setDeletingId(null)

    if (result.error) {
      setError(result.error)
    } else {
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
      router.refresh()
    }
  }

  const activeCategoriesForMerge = categories.filter(
    (c) => c.is_active && categoryToDelete && c.id !== categoryToDelete.id
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      {/* Left: Add category */}
      <div className="md:col-span-4 space-y-6">
        <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-[#1B255F]" />
              Kategorie erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Bezeichnung</label>
                <Input
                  id="name"
                  placeholder="z.B. Trainerhonorar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F]"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-800 border border-red-200 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full bg-[#1B255F] hover:bg-[#1B255F]/90 text-white font-semibold text-xs h-9 transition-colors rounded-lg shadow-sm"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : 'Kategorie anlegen'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right: Table */}
      <div className="md:col-span-8">
        <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Bestehende Kategorien ({categories.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider pl-6">Name</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Belege</TableHead>
                    <TableHead className="w-48 text-right text-slate-500 font-semibold text-[11px] uppercase tracking-wider pr-6">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-slate-800 font-medium text-[13px] pl-6 py-4">
                        {category.name}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          category.is_active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {category.is_active ? 'Aktiv' : 'Ausgeblendet'}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 font-mono text-xs">
                        {category.itemsCount}
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={togglingId === category.id}
                            onClick={() => handleToggle(category.id, category.is_active)}
                            className={`h-7 px-2.5 text-xs rounded-md gap-1 ${
                              category.is_active
                                ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={category.is_active ? 'Ausblenden' : 'Einblenden'}
                          >
                            {togglingId === category.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : category.is_active ? (
                              <>
                                <EyeOff className="h-3 w-3" />
                                <span>Ausblenden</span>
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3" />
                                <span>Einblenden</span>
                              </>
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === category.id}
                            onClick={() => handleDeleteClick(category)}
                            className="h-7 px-2.5 text-xs rounded-md gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Löschen"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Löschen</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Category Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl shadow-xl p-6 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-700 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Kategorie löschen
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Möchtest du die Kategorie <span className="font-semibold text-slate-800">„{categoryToDelete?.name}“</span> wirklich löschen?
            </DialogDescription>
          </DialogHeader>

          {categoryToDelete && categoryToDelete.itemsCount > 0 ? (
            <div className="py-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 space-y-1">
                  <p className="font-bold">Verknüpfte Belege vorhanden</p>
                  <p>Es existieren derzeit <span className="font-bold">{categoryToDelete.itemsCount} Spesenbelege</span> in dieser Kategorie.</p>
                  <p>Wähle eine neue Kategorie aus, um die bestehenden Belege dorthin zu verschieben, bevor die Kategorie gelöscht wird.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  Verschieben nach
                </label>
                {activeCategoriesForMerge.length > 0 ? (
                  <Select value={mergeCategoryId} onValueChange={(val) => setMergeCategoryId(val || '')}>
                    <SelectTrigger className="w-full border-slate-200 text-xs">
                      <SelectValue placeholder="Wähle eine Zielkategorie" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {activeCategoriesForMerge.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-red-600 font-medium">
                    Keine andere aktive Kategorie vorhanden. Erstelle zuerst eine andere Kategorie, um Belege dorthin verschieben zu können!
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4">
              <p className="text-xs text-slate-500">
                Diese Kategorie hat keine verknüpften Belege und kann bedenkenlos gelöscht werden.
              </p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setCategoryToDelete(null)
              }}
              className="text-xs border-slate-200 hover:bg-slate-50 h-9 rounded-lg"
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={
                deletingId !== null || 
                (categoryToDelete !== null && categoryToDelete.itemsCount > 0 && !mergeCategoryId)
              }
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-9 rounded-lg shadow-sm px-4 gap-1.5"
            >
              {deletingId !== null ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>
                {categoryToDelete && categoryToDelete.itemsCount > 0 
                  ? 'Belege verschieben & löschen' 
                  : 'Kategorie löschen'
                }
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
