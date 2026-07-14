'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCategory, toggleCategoryActive } from '@/app/actions/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Loader2, AlertCircle, Power } from 'lucide-react'

interface Category {
  id: string
  name: string
  is_active: boolean
}

export default function CategoryList({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Name</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Status</TableHead>
                    <TableHead className="w-32 text-right text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-slate-800 font-medium text-[13px]">
                        {category.name}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          category.is_active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {category.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={togglingId === category.id}
                          onClick={() => handleToggle(category.id, category.is_active)}
                          className={`h-7 px-2 text-xs rounded-md gap-1 ${
                            category.is_active
                              ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {togglingId === category.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Power className="h-3 w-3" />
                          )}
                          <span>{category.is_active ? 'Deaktivieren' : 'Aktivieren'}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
