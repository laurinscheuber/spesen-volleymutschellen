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
      {/* Left panel: Add category */}
      <div className="md:col-span-4 space-y-6">
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-blue-500" />
              Kategorie erstellen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="text-[10px] font-bold text-slate-500 uppercase">Bezeichnung</label>
                <Input
                  id="name"
                  placeholder="z.B. Trainerhonorar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="border-slate-800 bg-slate-950/50 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive-foreground border border-destructive/20 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs h-9 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kategorie anlegen'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right panel: Table */}
      <div className="md:col-span-8">
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl text-slate-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-450 uppercase tracking-wider">
              Bestehende Kategorien ({categories.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-slate-850">
                  <TableRow className="hover:bg-transparent border-slate-850">
                    <TableHead className="text-slate-400 font-medium">Name</TableHead>
                    <TableHead className="text-slate-400 font-medium">Status</TableHead>
                    <TableHead className="w-32 text-right text-slate-400 font-medium">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id} className="border-slate-850 hover:bg-slate-900/10">
                      <TableCell className="text-slate-205 font-medium text-xs">
                        {category.name}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          category.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-800'
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
                              ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                              : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
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
