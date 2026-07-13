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
    : [
        { href: '/dashboard', label: 'Meine Abrechnungen', icon: FileText },
        { href: '/dashboard/new', label: 'Spesen einreichen', icon: PlusCircle },
      ]

  return (
    <div className="min-h-screen bg-[#1B255F] text-[#E5EAF7] flex flex-col relative">
      <div className="absolute inset-0 bg-net-pattern -z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#4C6EBA]/8 via-[#1B255F]/95 to-[#1B255F] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-[#4B4B4B]/60 bg-[#1B255F]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center space-x-6">
            <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center space-x-2 group">
              <Volleyball className="h-6 w-6 text-[#4C6EBA] group-hover:rotate-45 transition-transform duration-300" />
              <span className="hidden sm:inline font-black uppercase tracking-wider text-[18px] text-[#E5EAF7]">
                Volley Mutschellen
              </span>
              <span className="sm:hidden font-black uppercase tracking-wider text-[18px] text-[#E5EAF7]">VM</span>
            </Link>

            <div className="h-5 w-px bg-[#4B4B4B] hidden sm:block" />

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
                        ? 'bg-[#4C6EBA]/15 text-[#E5EAF7] border border-[#4C6EBA]/25'
                        : 'text-[#C0C0C0] hover:text-[#E5EAF7] hover:bg-[#22307B]/60'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#4C6EBA]' : ''}`} />
                    <span className="hidden sm:inline">{link.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User info + Logout */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[13px] font-bold text-[#E5EAF7] leading-tight">{profile.full_name}</span>
              <span className="text-[11px] text-[#C0C0C0] capitalize">{profile.role === 'admin' ? 'Kassier' : 'Mitglied'}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-[#C0C0C0] hover:text-[#E5EAF7] hover:bg-[#22307B]/60 h-9 w-9 rounded-lg"
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
      <footer className="border-t border-[#4B4B4B]/40 py-5 text-center text-[11px] text-[#C0C0C0]/50">
        &copy; {new Date().getFullYear()} Volley Mutschellen TSV Rudolfstetten. Alle Rechte vorbehalten.
      </footer>
    </div>
  )
}
