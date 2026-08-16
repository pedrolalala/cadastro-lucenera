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

const ProtectedRoutes = () => {
  const { user, hasAccess, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) return <Login />

  if (hasAccess === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-sm w-full text-center space-y-3">
          <h1 className="text-lg font-semibold">Acesso negado</h1>
          <p className="text-sm text-muted-foreground">
            Sua conta não tem permissão para acessar o Cadastro. Fale com um administrador se
            acredita que isso é um engano.
          </p>
        </div>
      </div>
    )
  }

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
