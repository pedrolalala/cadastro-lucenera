import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Plus, Eye, Edit, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ProjetoFormDialog } from '@/components/projetos/ProjetoFormDialog'
import { ProjetoDetailsDialog } from '@/components/projetos/ProjetoDetailsDialog'

export default function Projetos() {
  const [projetos, setProjetos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterCliente, setFilterCliente] = useState<string>('todos')

  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedProjeto, setSelectedProjeto] = useState<any>(null)
  const { toast } = useToast()

  const fetchProjetos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('vw_projetos_dashboard')
      .select('*')
      .eq('arquivado', false)
      .order('data_entrada', { ascending: false })

    if (!error && data) {
      setProjetos(data)
    }
    setLoading(false)
  }

  const fetchClientes = async () => {
    const { data } = await supabase
      .from('contatos')
      .select('id, nome')
      .eq('tipo', 'cliente')
      .order('nome')
    if (data) setClientes(data)
  }

  useEffect(() => {
    fetchProjetos()
    fetchClientes()
  }, [])

  const handleArchive = async (id: string) => {
    if (!window.confirm('Deseja realmente arquivar este projeto?')) return

    const { error } = await supabase.from('projetos').update({ arquivado: true }).eq('id', id)

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao arquivar projeto.', variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Projeto arquivado com sucesso.' })
      fetchProjetos()
    }
  }

  const openEdit = (projeto: any) => {
    setSelectedProjeto(projeto)
    setFormOpen(true)
  }

  const openDetails = (projeto: any) => {
    setSelectedProjeto(projeto)
    setDetailsOpen(true)
  }

  const openNew = () => {
    setSelectedProjeto(null)
    setFormOpen(true)
  }

  const filtered = projetos.filter((p) => {
    const matchSearch =
      p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'todos' || p.status === filterStatus
    const matchCliente = filterCliente === 'todos' || p.cliente_id === filterCliente
    return matchSearch && matchStatus && matchCliente
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Projetos</h1>
          <p className="text-slate-500">Acompanhe e gerencie todos os projetos.</p>
        </div>
        <Button
          onClick={openNew}
          className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por código ou nome..."
            className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-amber-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="bg-slate-50 border-slate-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="Estudo Inicial">Estudo Inicial</SelectItem>
              <SelectItem value="Projeto executivo">Projeto executivo</SelectItem>
              <SelectItem value="Finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-64">
          <Select value={filterCliente} onValueChange={setFilterCliente}>
            <SelectTrigger className="bg-slate-50 border-slate-200">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Clientes</SelectItem>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Código</th>
                <th className="px-6 py-4 font-semibold">Nome</th>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Data Entrada</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p>Carregando projetos...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhum projeto encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900">{p.codigo}</td>
                    <td className="px-6 py-4 text-slate-700">{p.nome}</td>
                    <td className="px-6 py-4 text-slate-600 truncate max-w-[200px]">
                      {p.cliente_nome || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="secondary"
                        className="font-medium bg-amber-50 text-amber-700 border-amber-200"
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {p.data_entrada ? new Date(p.data_entrada).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Visualizar Detalhes"
                          onClick={() => openDetails(p)}
                          className="h-8 w-8 hover:text-amber-600 hover:bg-amber-50"
                        >
                          <Eye className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => openEdit(p)}
                          className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Arquivar"
                          onClick={() => handleArchive(p.id)}
                          className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
                        >
                          <Archive className="h-4 w-4 text-slate-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProjetoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        projeto={selectedProjeto}
        onSuccess={fetchProjetos}
      />

      <ProjetoDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        projeto={selectedProjeto}
      />
    </div>
  )
}
