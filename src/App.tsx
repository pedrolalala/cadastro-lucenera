import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import Pecas from './pages/Pecas'
import NotFound from './pages/NotFound'
import { DataProvider } from './stores/use-data-store'
import { AuthProvider, useAuth } from './hooks/use-auth'
import Login from './pages/Login'
import { PecaModal } from './components/modals/PecaModal'

const ProtectedRoutes = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/pecas" replace />} />
          <Route path="/projetos" element={<Navigate to="/pecas" replace />} />
          <Route path="/clientes" element={<Navigate to="/pecas" replace />} />
          <Route path="/pecas" element={<Pecas />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <PecaModal />
    </>
  )
}

const App = () => (
  <AuthProvider>
    <DataProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ProtectedRoutes />
        </TooltipProvider>
      </BrowserRouter>
    </DataProvider>
  </AuthProvider>
)

export default App
