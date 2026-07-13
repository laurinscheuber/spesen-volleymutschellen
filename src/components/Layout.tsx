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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-950/10 via-slate-950 to-slate-950 -z-10 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center space-x-2 text-white font-bold group">
              <Volleyball className="h-6 w-6 text-blue-500 group-hover:rotate-45 transition-transform duration-300" />
              <span className="hidden sm:inline tracking-tight">Volley Mutschellen</span>
              <span className="sm:hidden tracking-tight">VM</span>
            </Link>

            {/* Navigation links */}
            <nav className="flex space-x-1 sm:space-x-4">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-medium text-white">{profile.full_name}</span>
              <span className="text-xs text-slate-500 capitalize">{profile.role}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-slate-400 hover:text-white hover:bg-slate-900/50 h-9 w-9 rounded-lg"
              title="Abmelden"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600 bg-slate-950/30">
        <p>&copy; {new Date().getFullYear()} Volley Mutschellen. Alle Rechte vorbehalten.</p>
      </footer>
    </div>
  )
}
