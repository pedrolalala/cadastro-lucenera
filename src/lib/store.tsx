import React, { createContext, useContext, useState, ReactNode } from 'react'

export type Contato = {
  id: string
  name: string
  email: string
  phone: string
  company: string
  createdAt: string
}
export type Projeto = {
  id: string
  name: string
  deadline: string
  status: 'Pendente' | 'Em Andamento' | 'Concluído'
  clientId: string
  progress: number
  createdAt: string
}
export type Peca = {
  id: string
  sku: string
  name: string
  spec: string
  stock: number
  imageUrl: string
  createdAt: string
}

type StoreContextType = {
  contatos: Contato[]
  addContato: (c: Omit<Contato, 'id' | 'createdAt'>) => Promise<void>

  projetos: Projeto[]
  addProjeto: (p: Omit<Projeto, 'id' | 'createdAt'>) => Promise<void>

  pecas: Peca[]
  addPeca: (p: Omit<Peca, 'id' | 'createdAt'>) => Promise<void>

  modals: { cliente: boolean; projeto: boolean; peca: boolean }
  setModal: (type: 'cliente' | 'projeto' | 'peca', open: boolean) => void

  globalSearchOpen: boolean
  setGlobalSearchOpen: (open: boolean) => void
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [contatos, setContatos] = useState<Contato[]>([
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@empresa.com',
      phone: '(11) 99999-9999',
      company: 'Empresa A',
      createdAt: '2023-01-01T10:00:00Z',
    },
    {
      id: '2',
      name: 'Maria Souza',
      email: 'maria@outra.com',
      phone: '(11) 88888-8888',
      company: 'Indústria B',
      createdAt: '2023-02-15T14:30:00Z',
    },
  ])

  const [projetos, setProjetos] = useState<Projeto[]>([
    {
      id: '1',
      name: 'Estrutura Metálica',
      deadline: '2024-12-01',
      status: 'Em Andamento',
      clientId: '1',
      progress: 45,
      createdAt: '2023-05-10T09:00:00Z',
    },
    {
      id: '2',
      name: 'Peças Usinadas',
      deadline: '2024-08-20',
      status: 'Concluído',
      clientId: '2',
      progress: 100,
      createdAt: '2023-06-20T16:45:00Z',
    },
  ])

  const [pecas, setPecas] = useState<Peca[]>([
    {
      id: '1',
      sku: 'PC-001',
      name: 'Engrenagem 40D',
      spec: 'Aço carbono, 40 dentes',
      stock: 150,
      imageUrl: 'https://img.usecurling.com/p/200/200?q=gear',
      createdAt: '2023-01-10T11:20:00Z',
    },
    {
      id: '2',
      sku: 'PC-002',
      name: 'Eixo Transmissão',
      spec: 'Inox 304L',
      stock: 8,
      imageUrl: 'https://img.usecurling.com/p/200/200?q=steel%20shaft',
      createdAt: '2023-02-10T08:15:00Z',
    },
  ])

  const [modals, setModals] = useState({ cliente: false, projeto: false, peca: false })
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

  const addContato = async (c: Omit<Contato, 'id' | 'createdAt'>) => {
    await delay(500)
    setContatos((prev) => [
      { ...c, id: Math.random().toString(), createdAt: new Date().toISOString() },
      ...prev,
    ])
  }

  const addProjeto = async (p: Omit<Projeto, 'id' | 'createdAt'>) => {
    await delay(500)
    setProjetos((prev) => [
      { ...p, id: Math.random().toString(), createdAt: new Date().toISOString() },
      ...prev,
    ])
  }

  const addPeca = async (p: Omit<Peca, 'id' | 'createdAt'>) => {
    await delay(500)
    setPecas((prev) => [
      { ...p, id: Math.random().toString(), createdAt: new Date().toISOString() },
      ...prev,
    ])
  }

  const setModal = (type: 'cliente' | 'projeto' | 'peca', open: boolean) => {
    setModals((prev) => ({ ...prev, [type]: open }))
  }

  return (
    <StoreContext.Provider
      value={{
        contatos,
        addContato,
        projetos,
        addProjeto,
        pecas,
        addPeca,
        modals,
        setModal,
        globalSearchOpen,
        setGlobalSearchOpen,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
