'use client'

import { useState } from 'react'
import AdminDashboard from './AdminDashboard'
import AdminMembersList from './AdminMembersList'
import { ClipboardList, Users } from 'lucide-react'

export default function AdminPageClient({
  reports,
  members,
  currentUserId
}: {
  reports: any[]
  members: any[]
  currentUserId: string
}) {
  const [activeTab, setActiveTab] = useState<'reports' | 'members'>('reports')

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all -mb-px ${
            activeTab === 'reports'
              ? 'border-[#1B255F] text-[#1B255F] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Spesenberichte
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all -mb-px ${
            activeTab === 'members'
              ? 'border-[#1B255F] text-[#1B255F] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Users className="h-4 w-4" />
          Mitglieder & IBANs
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'reports' ? (
        <AdminDashboard reports={reports} />
      ) : (
        <AdminMembersList members={members} currentUserId={currentUserId} />
      )}
    </div>
  )
}
