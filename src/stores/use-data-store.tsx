import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { Cliente, Projeto, Peca, ActivityItem } from '@/types'
import { MOCK_PROJETOS, MOCK_PECAS, MOCK_ACTIVITY } from '@/lib/mock-data'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

type ModalType = 'cliente' | 'projeto' | 'peca' | null

interface DataStoreContextType {
  clientes: Cliente[]
  clientesLoading: boolean
  fetchClientes: () => Promise<void>
  projetos: Projeto[]
  pecas: Peca[]
  activities: ActivityItem[]

  // Modals state
  activeModal: ModalType
  editingId: string | null
  setActiveModal: (modal: ModalType, id?: string | null) => void
  closeModal: () => void

  // Actions
  saveCliente: (cliente: Omit<Cliente, 'id' | 'createdAt'>, id?: string | null) => Promise<void>
  deleteCliente: (id: string) => Promise<void>

  saveProjeto: (projeto: Omit<Projeto, 'id' | 'createdAt'>, id?: string | null) => void
  deleteProjeto: (id: string) => void

  savePeca: (peca: Omit<Peca, 'id' | 'createdAt'>, id?: string | null) => void
  deletePeca: (id: string) => void
}

const DataStoreContext = createContext<DataStoreContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clientesLoading, setClientesLoading] = useState(false)

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

  const fetchClientes = useCallback(async () => {
    setClientesLoading(true)
    const { data, error } = await supabase
      .from('contatos')
      .select('*')
      .eq('tipo', 'cliente')
      .order('nome', { ascending: true })

    if (data && !error) {
      const mapped = data.map((d) => ({
        id: d.id,
        tipo: 'Cliente',
        nome: d.nome,
        name: d.nome,
        tipo_pessoa: d.tipo_pessoa || 'Física',
        cpf: d.cpf,
        rg: d.rg,
        data_nascimento: d.data_nascimento,
        cnpj: d.cnpj,
        razao_social: d.razao_social,
        nome_empresa: d.nome_empresa,
        company: d.nome_empresa,
        email: d.email,
        email_financeiro: d.email_financeiro,
        telefone: d.telefone,
        phone: d.telefone,
        celular: d.celular,
        endereco: d.endereco,
        numero: d.numero,
        bairro: d.bairro,
        cep: d.cep,
        cidade: d.cidade,
        estado: d.estado,

        cep_entrega: d.cep_entrega,
        endereco_entrega: d.endereco_entrega,
        numero_entrega: d.numero_entrega,
        bairro_entrega: d.bairro_entrega,
        cidade_entrega: d.cidade_entrega,
        estado_entrega: d.estado_entrega,

        cep_cobranca: d.cep_cobranca,
        endereco_cobranca: d.endereco_cobranca,
        numero_cobranca: d.numero_cobranca,
        bairro_cobranca: d.bairro_cobranca,
        cidade_cobranca: d.cidade_cobranca,
        estado_cobranca: d.estado_cobranca,

        inscricao_estadual: d.inscricao_estadual,
        inscricao_municipal: d.inscricao_municipal,
        limite_credito: d.limite_credito,
        regime_apuracao: d.regime_apuracao,
        email_alternativo: d.email_alternativo,
        vendedor_id: d.vendedor_id,

        observacoes: d.observacoes,
        ativo: d.ativo !== false, // default true
        status: d.ativo !== false ? 'Ativo' : 'Inativo',
        createdAt: d.created_at || new Date().toISOString(),
      })) as Cliente[]
      setClientes(mapped)
    } else if (error) {
      console.error('Error fetching clientes:', error)
    }
    setClientesLoading(false)
  }, [])

  const saveCliente = async (data: Omit<Cliente, 'id' | 'createdAt'>, id?: string | null) => {
    const payload = {
      nome: data.nome || data.name || '',
      tipo_pessoa: data.tipo_pessoa || 'Física',
      cpf: data.cpf || null,
      rg: data.rg || null,
      data_nascimento: data.data_nascimento || null,
      cnpj: data.cnpj || null,
      razao_social: data.razao_social || null,
      nome_empresa: data.nome_empresa || data.company || null,
      email: data.email || null,
      email_financeiro: data.email_financeiro || null,
      telefone: data.telefone || data.phone || null,
      celular: data.celular || null,
      endereco: data.endereco || null,
      numero: data.numero || null,
      bairro: data.bairro || null,
      cep: data.cep || null,
      cidade: data.cidade || null,
      estado: data.estado || null,

      cep_entrega: data.cep_entrega || null,
      endereco_entrega: data.endereco_entrega || null,
      numero_entrega: data.numero_entrega || null,
      bairro_entrega: data.bairro_entrega || null,
      cidade_entrega: data.cidade_entrega || null,
      estado_entrega: data.estado_entrega || null,

      cep_cobranca: data.cep_cobranca || null,
      endereco_cobranca: data.endereco_cobranca || null,
      numero_cobranca: data.numero_cobranca || null,
      bairro_cobranca: data.bairro_cobranca || null,
      cidade_cobranca: data.cidade_cobranca || null,
      estado_cobranca: data.estado_cobranca || null,

      inscricao_estadual: data.inscricao_estadual || null,
      inscricao_municipal: data.inscricao_municipal || null,
      limite_credito: data.limite_credito || null,
      regime_apuracao: data.regime_apuracao || null,
      email_alternativo: data.email_alternativo || null,
      vendedor_id: data.vendedor_id || null,

      observacoes: data.observacoes || null,
      ativo: data.ativo ?? data.status === 'Ativo',
      tipo: 'cliente' as const,
    }

    if (id) {
      const { error } = await supabase.from('contatos').update(payload).eq('id', id)
      if (error) throw new Error(error.message)
      addActivity('Cliente', 'Atualizado', payload.nome)
    } else {
      const { error } = await supabase.from('contatos').insert([payload])
      if (error) throw new Error(error.message)
      addActivity('Cliente', 'Criado', payload.nome)
    }

    await fetchClientes()
  }

  const deleteCliente = async (id: string) => {
    const { error } = await supabase.from('contatos').delete().eq('id', id)
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o cliente.',
        variant: 'destructive',
      })
      return
    }
    await fetchClientes()
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
        clientesLoading,
        fetchClientes,
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
