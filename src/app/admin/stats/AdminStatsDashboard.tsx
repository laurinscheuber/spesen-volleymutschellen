'use client'

import { useState, useMemo } from 'react'
import { formatSwissDate, formatSwissDateShort } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Users, 
  Tags, 
  DollarSign,
  Filter,
  X,
  Wallet
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ExpenseItem {
  id: string
  amount: number
  date: string
  team: string
  category_name: string
}

// Helper to get volleyball season range
// The Swiss Volleyball season runs from autumn to spring.
// The financial club year (Vereinsjahr) starts on May 1st and ends on April 30th.
function getSeasonRange(offsetYear = 0): { start: string; end: string; label: string } {
  const now = new Date()
  let currentYear = now.getFullYear()
  
  // If we are currently before May, the current season started in the previous calendar year
  if (now.getMonth() < 4) { // 0-indexed: Jan (0) to Apr (3)
    currentYear -= 1
  }
  
  const targetYear = currentYear + offsetYear
  
  return {
    start: `${targetYear}-05-01`,
    end: `${targetYear + 1}-04-30`,
    label: `Saison ${targetYear}/${targetYear + 1}`
  }
}

export default function AdminStatsDashboard({ initialItems }: { initialItems: ExpenseItem[] }) {
  // Default to current volleyball season
  const [startDate, setStartDate] = useState(() => getSeasonRange(0).start)
  const [endDate, setEndDate] = useState(() => getSeasonRange(0).end)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [teamFilter, setTeamFilter] = useState('all')

  // Extract unique categories and teams for filter lists
  const categoriesList = useMemo(() => {
    return Array.from(new Set(initialItems.map(item => item.category_name))).sort()
  }, [initialItems])

  const teamsList = useMemo(() => {
    return Array.from(new Set(initialItems.map(item => item.team))).sort()
  }, [initialItems])

  // Quick helper to clear all filters
  const handleShowAll = () => {
    setStartDate('')
    setEndDate('')
    setCategoryFilter('all')
    setTeamFilter('all')
  }

  // Quick helper to filter for current season
  const handleCurrentSeason = () => {
    const range = getSeasonRange(0)
    setStartDate(range.start)
    setEndDate(range.end)
  }

  // Quick helper to filter for last season
  const handleLastSeason = () => {
    const range = getSeasonRange(-1)
    setStartDate(range.start)
    setEndDate(range.end)
  }

  // Filtered dataset
  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      const itemDate = item.date.split('T')[0]
      if (startDate && itemDate < startDate) return false
      if (endDate && itemDate > endDate) return false
      if (categoryFilter !== 'all' && item.category_name !== categoryFilter) return false
      if (teamFilter !== 'all' && item.team !== teamFilter) return false
      return true
    })
  }, [initialItems, startDate, endDate, categoryFilter, teamFilter])

  // KPIs
  const totalAmount = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + item.amount, 0)
  }, [filteredItems])

  const averageAmount = useMemo(() => {
    if (filteredItems.length === 0) return 0
    return totalAmount / filteredItems.length
  }, [filteredItems, totalAmount])

  // Category Breakdown
  const categoryStats = useMemo(() => {
    const groups: { [key: string]: number } = {}
    filteredItems.forEach((item) => {
      groups[item.category_name] = (groups[item.category_name] || 0) + item.amount
    })

    return Object.entries(groups)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredItems, totalAmount])

  // Team Breakdown
  const teamStats = useMemo(() => {
    const groups: { [key: string]: number } = {}
    filteredItems.forEach((item) => {
      groups[item.team] = (groups[item.team] || 0) + item.amount
    })

    return Object.entries(groups)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredItems, totalAmount])

  // Monthly Breakdown (Time Series)
  const monthlyStats = useMemo(() => {
    const groups: { [key: string]: number } = {}
    filteredItems.forEach((item) => {
      const monthKey = item.date.substring(0, 7) // YYYY-MM
      groups[monthKey] = (groups[monthKey] || 0) + item.amount
    })

    // Sort by month ascending
    const sortedEntries = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
    const maxVal = sortedEntries.length > 0 ? Math.max(...sortedEntries.map((e) => e[1])) : 0

    return sortedEntries.map(([month, amount]) => {
      const [year, m] = month.split('-')
      // Format month as Short name (e.g. Jan 2026)
      const date = new Date(Number(year), Number(m) - 1, 1)
      const label = formatSwissDateShort(date)
      return {
        month,
        label,
        amount,
        heightPercent: maxVal > 0 ? (amount / maxVal) * 100 : 0
      }
    })
  }, [filteredItems])

  const hasActiveFilters = startDate || endDate || categoryFilter !== 'all' || teamFilter !== 'all'

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
        <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-[#1B255F]" />
            Spesen filtern {(startDate || endDate) && <span className="text-[10px] text-slate-400 font-mono tracking-normal normal-case ml-1">({formatSwissDate(startDate)} bis {formatSwissDate(endDate)})</span>}
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowAll}
              className="h-7 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg gap-1 font-bold px-2.5"
            >
              <X className="h-3 w-3" />
              Zurücksetzen
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Quick Selection Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCurrentSeason}
              className="text-xs border-slate-200 hover:bg-slate-50 rounded-lg h-8 font-bold text-[#1B255F]"
            >
              Aktuelle Saison
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLastSeason}
              className="text-xs border-slate-200 hover:bg-slate-50 rounded-lg h-8 font-bold text-[#1B255F]"
            >
              Letzte Saison
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowAll}
              className="text-xs border-slate-200 hover:bg-slate-50 rounded-lg h-8 font-bold text-[#1B255F]"
            >
              Gesamter Zeitraum
            </Button>
          </div>

          {/* Detailed Filters (Dates + Selects) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-100 pt-4">
            {/* Start Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Startdatum
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 border-slate-200 bg-white text-slate-900 text-xs focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F] rounded-lg"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                Enddatum
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 border-slate-200 bg-white text-slate-900 text-xs focus:border-[#1B255F] focus:ring-1 focus:ring-[#1B255F] rounded-lg"
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Tags className="h-3 w-3 text-slate-400" />
                Kategorie
              </label>
              <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || 'all')}>
                <SelectTrigger className="h-9 border-slate-200 text-xs bg-white w-full rounded-lg">
                  <SelectValue placeholder="Alle Kategorien" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="all" className="text-xs">Alle Kategorien</SelectItem>
                  {categoriesList.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Team Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Users className="h-3 w-3 text-slate-400" />
                Team / Ressort
              </label>
              <Select value={teamFilter} onValueChange={(val) => setTeamFilter(val || 'all')}>
                <SelectTrigger className="h-9 border-slate-200 text-xs bg-white w-full rounded-lg">
                  <SelectValue placeholder="Alle Teams" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="all" className="text-xs">Alle Teams</SelectItem>
                  {teamsList.map((team) => (
                    <SelectItem key={team} value={team} className="text-xs">
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-slate-200 bg-white text-slate-900 shadow-md relative rounded-xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#1B255F]" />
          <CardContent className="pt-5 pb-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ausbezahltes Gesamtbudget</span>
              <p className="text-2xl font-black text-[#1B255F] font-mono leading-none pt-0.5">
                CHF {totalAmount.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-400">Für die gewählten Filter</p>
            </div>
            <div className="p-3 bg-[#1B255F]/5 text-[#1B255F] rounded-xl border border-[#1B255F]/10">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-900 shadow-md relative rounded-xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
          <CardContent className="pt-5 pb-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Anzahl Belege</span>
              <p className="text-2xl font-black text-blue-600 font-mono leading-none pt-0.5">
                {filteredItems.length} Belege
              </p>
              <p className="text-[11px] text-slate-400">Erfolgreich ausbezahlt</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-900 shadow-md relative rounded-xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
          <CardContent className="pt-5 pb-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Durchschnitt pro Beleg</span>
              <p className="text-2xl font-black text-emerald-600 font-mono leading-none pt-0.5">
                CHF {averageAmount.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-400">Durchschnittliche Erstattung</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Categories and Teams Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Breakdown */}
        <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-[14px] font-bold text-[#1B255F] flex items-center gap-1.5">
              <Tags className="h-4.5 w-4.5 text-[#1B255F]" />
              Ausgaben nach Kategorie
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {categoryStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Keine Daten verfügbar.</p>
            ) : (
              categoryStats.map((stat) => (
                <div key={stat.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      {stat.name}
                    </span>
                    <span className="font-mono text-slate-600">
                      CHF {stat.amount.toFixed(2)} <span className="text-[10px] text-slate-400">({stat.percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Teams Breakdown */}
        <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-[14px] font-bold text-[#1B255F] flex items-center gap-1.5">
              <Users className="h-4.5 w-4.5 text-[#1B255F]" />
              Ausgaben nach Team / Ressort
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {teamStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Keine Daten verfügbar.</p>
            ) : (
              teamStats.map((stat) => (
                <div key={stat.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                      {stat.name}
                    </span>
                    <span className="font-mono text-slate-600">
                      CHF {stat.amount.toFixed(2)} <span className="text-[10px] text-slate-400">({stat.percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Timeline Chart */}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-md rounded-xl">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-[14px] font-bold text-[#1B255F] flex items-center gap-1.5">
            <BarChart3 className="h-4.5 w-4.5 text-[#1B255F]" />
            Monatlicher Ausgabenverlauf
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {monthlyStats.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Keine Zeitdaten verfügbar.</p>
          ) : (
            <div className="space-y-6">
              {/* Desktop Bar Visualizer */}
              <div className="h-48 items-end gap-3 px-2 pt-4 hidden sm:flex border-b border-slate-100 pb-1">
                {monthlyStats.map((stat) => (
                  <div key={stat.month} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-mono whitespace-nowrap shadow-md pointer-events-none">
                      CHF {stat.amount.toFixed(2)}
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full bg-slate-100 rounded-t-lg h-36 flex items-end overflow-hidden">
                      <div 
                        className="bg-[#1B255F] w-full rounded-t-lg group-hover:bg-[#1B255F]/85 transition-all duration-500" 
                        style={{ height: `${stat.heightPercent}%` }}
                      />
                    </div>
                    {/* Label */}
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center block leading-none">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mobile Table/List View */}
              <div className="space-y-3 sm:hidden">
                {monthlyStats.map((stat) => (
                  <div key={stat.month} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2">
                    <span className="font-semibold text-slate-700">{stat.label}</span>
                    <span className="font-mono text-slate-900 font-bold">CHF {stat.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
