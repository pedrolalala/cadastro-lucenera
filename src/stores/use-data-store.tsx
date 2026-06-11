import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Cliente, Projeto, Peca, ActivityItem } from '@/types'
import { MOCK_CLIENTES, MOCK_PROJETOS, MOCK_PECAS, MOCK_ACTIVITY } from '@/lib/mock-data'
import { toast } from '@/hooks/use-toast'

type ModalType = 'cliente' | 'projeto' | 'peca' | null

interface DataStoreContextType {
  clientes: Cliente[]
  projetos: Projeto[]
  pecas: Peca[]
  activities: ActivityItem[]

  // Modals state
  activeModal: ModalType
  editingId: string | null
  setActiveModal: (modal: ModalType, id?: string | null) => void
  closeModal: () => void

  // Actions
  saveCliente: (cliente: Omit<Cliente, 'id' | 'createdAt'>, id?: string | null) => void
  deleteCliente: (id: string) => void

  saveProjeto: (projeto: Omit<Projeto, 'id' | 'createdAt'>, id?: string | null) => void
  deleteProjeto: (id: string) => void

  savePeca: (peca: Omit<Peca, 'id' | 'createdAt'>, id?: string | null) => void
  deletePeca: (id: string) => void
}

const DataStoreContext = createContext<DataStoreContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>(MOCK_CLIENTES)
  const [projetos, setProjetos] = useState<Projeto[]>(MOCK_PROJETOS)
  const [pecas, setPecas] = useState<Peca[]>(MOCK_PECAS)
  const [activities, setActivities] = useState<ActivityItem[]>(MOCK_ACTIVITY)

  const [activeModal, setActiveModalState] = useState<ModalType>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const setActiveModal = (modal: ModalType, id: string | null = null) => {
    setActiveModalState(modal)
    setEditingId(id)
  }

  const closeModal = () => {
    setActiveModalState(null)
    setEditingId(null)
  }

  const addActivity = (
    type: ActivityItem['type'],
    action: ActivityItem['action'],
    itemName: string,
  ) => {
    setActivities((prev) =>
      [
        {
          id: Math.random().toString(),
          type,
          action,
          itemName,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 10),
    )
  }

  const saveCliente = (data: Omit<Cliente, 'id' | 'createdAt'>, id?: string | null) => {
    if (id) {
      setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
      addActivity('Cliente', 'Atualizado', data.name)
      toast({ title: 'Sucesso', description: 'Cliente atualizado com sucesso.' })
    } else {
      setClientes((prev) => [
        { ...data, id: Math.random().toString(), createdAt: new Date().toISOString() },
        ...prev,
      ])
      addActivity('Cliente', 'Criado', data.name)
      toast({ title: 'Sucesso', description: 'Cliente cadastrado com sucesso!' })
    }
    closeModal()
  }

  const deleteCliente = (id: string) => {
    setClientes((prev) => prev.filter((c) => c.id !== id))
    toast({ title: 'Removido', description: 'Cliente removido com sucesso.' })
  }

  const saveProjeto = (data: Omit<Projeto, 'id' | 'createdAt'>, id?: string | null) => {
    if (id) {
      setProjetos((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
      addActivity('Projeto', 'Atualizado', data.name)
      toast({ title: 'Sucesso', description: 'Projeto atualizado com sucesso.' })
    } else {
      setProjetos((prev) => [
        { ...data, id: Math.random().toString(), createdAt: new Date().toISOString() },
        ...prev,
      ])
      addActivity('Projeto', 'Criado', data.name)
      toast({ title: 'Sucesso', description: 'Projeto criado com sucesso!' })
    }
    closeModal()
  }

  const deleteProjeto = (id: string) => {
    setProjetos((prev) => prev.filter((p) => p.id !== id))
    toast({ title: 'Removido', description: 'Projeto removido com sucesso.' })
  }

  const savePeca = (data: Omit<Peca, 'id' | 'createdAt'>, id?: string | null) => {
    if (id) {
      setPecas((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
      addActivity('Peça', 'Atualizado', data.name)
      toast({ title: 'Sucesso', description: 'Peça atualizada com sucesso.' })
    } else {
      setPecas((prev) => [
        { ...data, id: Math.random().toString(), createdAt: new Date().toISOString() },
        ...prev,
      ])
      addActivity('Peça', 'Criado', data.name)
      toast({ title: 'Sucesso', description: 'Peça cadastrada com sucesso!' })
    }
    closeModal()
  }

  const deletePeca = (id: string) => {
    setPecas((prev) => prev.filter((p) => p.id !== id))
    toast({ title: 'Removido', description: 'Peça removida com sucesso.' })
  }

  return (
    <DataStoreContext.Provider
      value={{
        clientes,
        projetos,
        pecas,
        activities,
        activeModal,
        editingId,
        setActiveModal,
        closeModal,
        saveCliente,
        deleteCliente,
        saveProjeto,
        deleteProjeto,
        savePeca,
        deletePeca,
      }}
    >
      {children}
    </DataStoreContext.Provider>
  )
}

export default function useDataStore() {
  const context = useContext(DataStoreContext)
  if (!context) throw new Error('useDataStore must be used within a DataProvider')
  return context
}
