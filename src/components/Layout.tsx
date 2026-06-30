import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { MobileBottomNav } from './MobileBottomNav'
import { GlobalSearch } from './GlobalSearch'
import { ClienteModal } from './modals/ClienteModal'
import { ProjetoModal } from './modals/ProjetoModal'
import { PecaModal } from './modals/PecaModal'

export default function Layout() {
  return (
    <div className="flex min-h-screen w-full bg-slate-50/50">
      <AppSidebar />
      <div className="flex flex-1 flex-col w-full pb-16 md:pb-0 relative">
        <AppHeader />
        <main className="flex-1 p-4 md:p-8 overflow-auto animate-fade-in-up">
          <div className="w-full max-w-[1800px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileBottomNav />

      {/* Global Features */}
      <GlobalSearch />
      <ClienteModal />
      <ProjetoModal />
      <PecaModal />
    </div>
  )
}
