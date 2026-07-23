'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'
import { Volleyball, LogOut, FileText, PlusCircle, Settings, ClipboardList, Users, Tags, Search, BarChart3, Menu, X, Bell, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface LayoutProps {
  children: React.ReactNode
  profile: {
    full_name: string
    email: string
    role: 'user' | 'admin'
  }
}

export default function AppLayout({ children, profile }: LayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [activities, setActivities] = useState<any[]>([])
  const [bellOpen, setBellOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // 1. Fetch pending reports count (for admin only)
    const fetchPendingCount = async () => {
      if (profile.role !== 'admin') return
      
      const { count, error } = await supabase
        .from('expense_reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'offen')

      if (!error && count !== null) {
        setPendingCount(count)
      }
    }

    // 2. Fetch latest activities (last 5 reports)
    const fetchActivities = async () => {
      let query = supabase
        .from('expense_reports')
        .select(`
          id,
          created_at,
          status,
          user_id,
          profiles (
            full_name
          ),
          expense_items (
            amount
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      // Regular users only see their own activities, admins see all
      if (profile.role !== 'admin') {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          query = query.eq('user_id', user.id)
        } else {
          return
        }
      }

      const { data, error } = await query

      if (!error && data) {
        const formatted = data.map((r: any) => {
          const profileName = r.profiles?.full_name || 'Unbekannt'
          const total = (r.expense_items || []).reduce((sum: number, item: any) => sum + Number(item.amount), 0)
          
          let description = ''
          if (profile.role === 'admin') {
            if (r.status === 'offen') {
              description = `${profileName} hat einen neuen Spesenbericht über CHF ${total.toFixed(2)} eingereicht.`
            } else if (r.status === 'in_auftrag') {
              description = `Bericht von ${profileName} über CHF ${total.toFixed(2)} wurde freigegeben.`
            } else if (r.status === 'ausbezahlt') {
              description = `Bericht von ${profileName} über CHF ${total.toFixed(2)} wurde ausbezahlt.`
            } else {
              description = `Bericht von ${profileName} über CHF ${total.toFixed(2)} wurde abgelehnt.`
            }
          } else {
            if (r.status === 'offen') {
              description = `Du hast einen Spesenbericht über CHF ${total.toFixed(2)} eingereicht.`
            } else if (r.status === 'in_auftrag') {
              description = `Dein Bericht über CHF ${total.toFixed(2)} wurde freigegeben.`
            } else if (r.status === 'ausbezahlt') {
              description = `Dein Bericht über CHF ${total.toFixed(2)} wurde ausbezahlt.`
            } else {
              description = `Dein Bericht über CHF ${total.toFixed(2)} wurde abgelehnt.`
            }
          }

          // Calculate time ago
          const created = new Date(r.created_at)
          const diffMs = new Date().getTime() - created.getTime()
          const diffMins = Math.floor(diffMs / 60000)
          const diffHours = Math.floor(diffMins / 60)
          const diffDays = Math.floor(diffHours / 24)

          let timeAgo = 'Gerade eben'
          if (diffDays > 0) {
            timeAgo = `vor ${diffDays} Tag${diffDays === 1 ? '' : 'en'}`
          } else if (diffHours > 0) {
            timeAgo = `vor ${diffHours} Std.`
          } else if (diffMins > 0) {
            timeAgo = `vor ${diffMins} Min.`
          }

          return {
            id: r.id,
            profileName,
            status: r.status,
            description,
            timeAgo
          }
        })
        setActivities(formatted)
      }
    }

    fetchPendingCount()
    fetchActivities()

    // Real-time subscription
    const subscription = supabase
      .channel('expense_reports_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_reports' }, () => {
        fetchPendingCount()
        fetchActivities()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [profile.role])

  useEffect(() => {
    if (!bellOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.bell-container')) {
        setBellOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [bellOpen])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  const isAdmin = profile.role === 'admin'

  const links = isAdmin
    ? [
        { href: '/dashboard', label: 'Meine Spesen', icon: FileText },
        { href: '/admin', label: 'Spesenübersicht', icon: ClipboardList },
        { href: '/admin/stats', label: 'Statistiken', icon: BarChart3 },
        { href: '/admin/members', label: 'Mitglieder & IBANs', icon: Users },
        { href: '/admin/categories', label: 'Kategorien', icon: Tags },
      ]
    : [] // No links in desktop header for regular users

  const mobileLinks = isAdmin
    ? [
        { href: '/dashboard', label: 'Meine Spesen', icon: FileText },
        { href: '/admin', label: 'Spesenübersicht', icon: ClipboardList },
        { href: '/admin/stats', label: 'Statistiken', icon: BarChart3 },
        { href: '/admin/members', label: 'Mitglieder & IBANs', icon: Users },
        { href: '/admin/categories', label: 'Kategorien', icon: Tags },
      ]
    : [
        { href: '/dashboard', label: 'Meine Spesen', icon: FileText },
      ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative overflow-x-hidden w-full">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center space-x-6">
            <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center space-x-2 group shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="https://volleymutschellen.ch/images/volley-logo-white.png" 
                alt="Volley Mutschellen Logo" 
                className="h-14 w-auto logo-blue object-contain" 
              />
            </Link>

            {links.length > 0 && (
              <>
                <div className="h-5 w-px bg-slate-200 hidden lg:block" />
                <nav className="hidden lg:flex space-x-1">
                  {links.map((link) => {
                    const Icon = link.icon
                    const isActive =
                      pathname === link.href ||
                      (link.href !== '/dashboard' && link.href !== '/admin' && pathname.startsWith(link.href)) ||
                      (link.href === '/admin' && pathname === '/admin') ||
                      (link.href === '/dashboard' && pathname === '/dashboard')
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                          isActive
                            ? 'bg-slate-100 text-[#1B255F] border border-slate-200/50'
                            : 'text-slate-500 hover:text-[#1B255F] hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? 'text-[#1B255F]' : ''}`} />
                        <span>{link.label}</span>
                        {link.href === '/admin' && pendingCount > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 text-[9px] font-black bg-rose-600 text-white rounded-full leading-none min-w-4 text-center">
                            {pendingCount}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </>
            )}
          </div>

          {/* User info + Logout */}
          <div className="flex items-center space-x-2">
            <Link href="/profile" className="hidden md:flex flex-col text-right hover:opacity-80 group shrink-0">
              <span className="text-[13px] font-bold text-slate-800 leading-tight group-hover:text-[#1B255F] transition-colors">{profile.full_name}</span>
              <span className="text-[11px] text-slate-400 capitalize flex items-center justify-end gap-1">
                {profile.role === 'admin' ? 'Kassier' : 'Mitglied'}
                <span className="text-[9px] text-[#1B255F]/60 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Bearbeiten</span>
              </span>
            </Link>

            {/* Notification Bell */}
            <div className="relative bell-container hidden lg:block">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBellOpen(!bellOpen)}
                className={cn(
                  "text-slate-400 hover:text-slate-600 hover:bg-slate-50 h-9 w-9 rounded-lg relative",
                  bellOpen && "bg-slate-100 text-[#1B255F]"
                )}
                title="Aktivitäten & Benachrichtigungen"
              >
                <Bell className="h-4 w-4" />
                {profile.role === 'admin' && pendingCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-600 ring-2 ring-white animate-pulse" />
                )}
              </Button>

              {bellOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-extrabold text-[11px] text-[#1B255F] uppercase tracking-wider">Aktivitäten</span>
                    {profile.role === 'admin' && pendingCount > 0 && (
                      <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {pendingCount} offen
                      </span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {activities.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-400">Keine Aktivitäten</div>
                    ) : (
                      activities.map((act) => (
                        <Link
                          key={act.id}
                          href={profile.role === 'admin' ? `/admin/reports/${act.id}` : `/dashboard/reports/${act.id}`}
                          onClick={() => setBellOpen(false)}
                          className="block px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] font-bold text-slate-700 leading-tight">
                              {act.profileName}
                            </span>
                            <span className={cn(
                              "text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                              act.status === 'offen' && "bg-amber-100 text-amber-800",
                              act.status === 'in_auftrag' && "bg-blue-100 text-blue-800",
                              act.status === 'ausbezahlt' && "bg-green-100 text-green-800",
                              act.status === 'abgelehnt' && "bg-red-100 text-red-800"
                            )}>
                              {act.status === 'in_auftrag' ? 'freigegeben' : act.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                            {act.description}
                          </p>
                          <span className="text-[9px] text-slate-400 mt-1 block">
                            {act.timeAgo}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                  {profile.role === 'admin' && (
                    <div className="px-4 pt-2 pb-1 border-t border-slate-100 text-center">
                      <Link
                        href="/admin"
                        onClick={() => setBellOpen(false)}
                        className="text-[11px] font-bold text-[#1B255F] hover:underline"
                      >
                        Alle Spesen anzeigen
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isAdmin && (
              <Link href="/admin/archive" className="hidden lg:block">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50",
                    pathname.startsWith('/admin/archive') && "text-[#1B255F] bg-slate-100 border border-slate-200/50"
                  )}
                  title="Spesenarchiv & Suche"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </Link>
            )}

            <Link href="/profile" className="hidden lg:block">
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 h-9 w-9 rounded-lg"
                title="Profil & IBAN bearbeiten"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 h-9 w-9 rounded-lg hidden lg:block"
              title="Abmelden"
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {mobileLinks.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-slate-400 hover:text-slate-600 hover:bg-slate-50 h-9 w-9 rounded-lg"
                title="Menü öffnen"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4.5 w-4.5" />}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && mobileLinks.length > 0 && (
        <div className="lg:hidden border-b border-slate-200 bg-white shadow-inner py-3 px-4 space-y-1 sticky top-20 z-40">
          {mobileLinks.map((link) => {
            const Icon = link.icon
            const isActive =
              pathname === link.href ||
              (link.href !== '/dashboard' && link.href !== '/admin' && pathname.startsWith(link.href)) ||
              (link.href === '/admin' && pathname === '/admin') ||
              (link.href === '/dashboard' && pathname === '/dashboard')
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center space-x-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-slate-100 text-[#1B255F] border border-slate-200/50"
                    : "text-slate-600 hover:text-[#1B255F] hover:bg-slate-50"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-[#1B255F]" : "text-slate-400")} />
                <span>{link.label}</span>
              </Link>
            )
          })}

          {/* Add Search, Profile/Settings and Logout to the mobile menu list! */}
          <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
            {isAdmin && (
              <Link
                href="/admin/archive"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center space-x-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors",
                  pathname.startsWith('/admin/archive')
                    ? "bg-slate-100 text-[#1B255F] border border-slate-200/50"
                    : "text-slate-600 hover:text-[#1B255F] hover:bg-slate-50"
                )}
              >
                <Search className={cn("h-4 w-4", pathname.startsWith('/admin/archive') ? "text-[#1B255F]" : "text-slate-400")} />
                <span>Spesenarchiv & Suche</span>
              </Link>
            )}

            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center space-x-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors",
                pathname === '/profile'
                  ? "bg-slate-100 text-[#1B255F] border border-slate-200/50"
                  : "text-slate-600 hover:text-[#1B255F] hover:bg-slate-50"
              )}
            >
              <Settings className={cn("h-4 w-4", pathname === '/profile' ? "text-[#1B255F]" : "text-slate-400")} />
              <span>Profil & IBAN bearbeiten</span>
            </Link>

            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleSignOut()
              }}
              className="w-full flex items-center space-x-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4 text-rose-500" />
              <span>Abmelden</span>
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-5 text-center text-[11px] text-slate-400">
        &copy; {new Date().getFullYear()} Volley Mutschellen TSV Rudolfstetten. Alle Rechte vorbehalten.
      </footer>
    </div>
  )
}
