import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { consumeCodeFromUrl } from '@/lib/cross-system-auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  hasAccess: boolean | null
  // SPEC-174 N7: todo mundo com `hasAccess` consulta produto; só quem tem a
  // ação "editar" no sistema "cadastro" (via hub_pode_executar) vê/usa
  // Editar/Copiar/Excluir e o duplo clique que abre edição. null enquanto
  // não resolvido ainda (trata como sem permissão até a RPC responder).
  canEdit: boolean | null
  // SPEC-174 N7 (decisão 02/10): "Nova Peça" só para quem tem a ação "criar"
  // no Cadastro (administração + compras). null enquanto não resolvido.
  canCreate: boolean | null
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [canEdit, setCanEdit] = useState<boolean | null>(null)
  const [canCreate, setCanCreate] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  // SPEC-069: este app só checava estar logado, sem nenhuma permissão
  // granular do Hub. Consulta a mesma RPC que o Hub usa (hub_pode_executar,
  // SPEC-006) para o sistema inteiro ('cadastro', sem módulo/ação
  // específicos).
  useEffect(() => {
    if (!user?.id) {
      setHasAccess(null)
      return
    }
    supabase
      .rpc('hub_pode_executar', {
        p_usuario_id: user.id,
        p_system_slug: 'cadastro',
        p_modulo_chave: null,
        p_acao: null,
      })
      .then(({ data }) => setHasAccess(Boolean(data)))
  }, [user?.id])

  // SPEC-174 N7: permissão por ação, mesmo mecanismo (hub_pode_executar),
  // agora com p_acao = 'editar'. A matriz papel x ação (quem tem a ação
  // "editar" em papel_permissoes para o sistema "cadastro") ainda vai ser
  // fechada com o Vinícius (ligação de 02/10) — este hook só consulta o que
  // já estiver cadastrado no Hub, sem nenhuma regra fixa por e-mail/nome.
  useEffect(() => {
    if (!user?.id) {
      setCanEdit(null)
      return
    }
    supabase
      .rpc('hub_pode_executar', {
        p_usuario_id: user.id,
        p_system_slug: 'cadastro',
        p_modulo_chave: null,
        p_acao: 'editar',
      })
      .then(({ data }) => setCanEdit(Boolean(data)))
  }, [user?.id])

  // SPEC-174 N7: mesma checagem, ação "criar" (botão "Nova Peça").
  useEffect(() => {
    if (!user?.id) {
      setCanCreate(null)
      return
    }
    supabase
      .rpc('hub_pode_executar', {
        p_usuario_id: user.id,
        p_system_slug: 'cadastro',
        p_modulo_chave: null,
        p_acao: 'criar',
      })
      .then(({ data }) => setCanCreate(Boolean(data)))
  }, [user?.id])

  useEffect(() => {
    let mounted = true
    let initialized = false

    // Acesso vindo da Central chega com ?sso_code na URL. onAuthStateChange
    // dispara um evento inicial com a sessão que já existia ANTES da troca
    // desse código terminar (normalmente nula, numa aba nova) — se esse
    // evento resolvesse "loading" pra false direto, o app achava que
    // ninguém tinha logado antes da troca terminar, "bugando" o clique
    // vindo da Central. Por isso a resolução real só acontece depois do
    // consumeCodeFromUrl + getSession abaixo.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted || !initialized) return
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
    })

    consumeCodeFromUrl('cadastro')
      .catch(() => {})
      .finally(() => {
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
          if (!mounted) return
          initialized = true
          setSession(initialSession)
          setUser(initialSession?.user ?? null)
          setLoading(false)
        })
      })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    return { error }
  }
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{ user, session, hasAccess, canEdit, canCreate, signUp, signIn, signOut, loading }}
    >
      {children}
    </AuthContext.Provider>
  )
}
