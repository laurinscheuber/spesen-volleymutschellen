'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'
import { Volleyball, LogOut, FileText, PlusCircle, Settings, ClipboardList, Users, Tags, Search, BarChart3, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative">
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
