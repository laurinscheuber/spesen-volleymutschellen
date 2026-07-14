'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'
import { Volleyball, LogOut, FileText, PlusCircle, Settings, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  const isAdmin = profile.role === 'admin'

  const links = isAdmin
    ? [
        { href: '/admin', label: 'Offene Spesen', icon: ClipboardList },
        { href: '/admin/categories', label: 'Kategorien', icon: Settings },
      ]
    : [] // No links in header for regular users

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center space-x-6">
            <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center space-x-2 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="https://volleymutschellen.ch/images/volley-logo-white.png" 
                alt="Volley Mutschellen Logo" 
                className="h-9 w-auto logo-blue object-contain" 
              />
              <span className="hidden sm:inline font-black uppercase tracking-wider text-[17px] text-[#1B255F]">
                Volley Mutschellen
              </span>
              <span className="sm:hidden font-black uppercase tracking-wider text-[17px] text-[#1B255F]">VM</span>
            </Link>

            {links.length > 0 && (
              <>
                <div className="h-5 w-px bg-slate-200 hidden sm:block" />
                <nav className="flex space-x-1">
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
                        <span className="hidden sm:inline">{link.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </>
            )}
          </div>

          {/* User info + Logout */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[13px] font-bold text-slate-800 leading-tight">{profile.full_name}</span>
              <span className="text-[11px] text-slate-400 capitalize">{profile.role === 'admin' ? 'Kassier' : 'Mitglied'}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 h-9 w-9 rounded-lg"
              title="Abmelden"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

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
