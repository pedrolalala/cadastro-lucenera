import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Plus,
  Edit,
  Archive,
  Briefcase,
  Calendar,
  User,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ProjetoFormDialog } from '@/components/projetos/ProjetoFormDialog'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function Projetos() {
  const [projetos, setProjetos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterCliente, setFilterCliente] = useState<string>('todos')

  const [formOpen, setFormOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

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

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('Deseja realmente arquivar este projeto?')) return

    const { error } = await supabase.from('projetos').update({ arquivado: true }).eq('id', id)

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao arquivar projeto.', variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Projeto arquivado com sucesso.' })
      if (selectedId === id) setSelectedId(null)
      fetchProjetos()
    }
  }

  const filtered = projetos.filter((p) => {
    const matchSearch =
      p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'todos' || p.status === filterStatus
    const matchCliente = filterCliente === 'todos' || p.cliente_id === filterCliente
    return matchSearch && matchStatus && matchCliente
  })

  const selectedProjeto = useMemo(() => {
    return projetos.find((p) => p.id === selectedId) || null
  }, [projetos, selectedId])

  const handleSelect = (id: string) => {
    if (selectedId === id) return
    setLoadingDetails(true)
    setSelectedId(id)
    setTimeout(() => {
      setLoadingDetails(false)
    }, 300)
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Projetos</h1>
          <p className="text-slate-500 text-sm mt-1">Acompanhe e gerencie todos os projetos.</p>
        </div>
        <Button
          onClick={() => {
            setSelectedId(null)
            setFormOpen(true)
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Lista (70%) */}
        <div className="w-full lg:w-[70%] space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por código ou nome..."
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="Estudo Inicial">Estudo Inicial</SelectItem>
                  <SelectItem value="Projeto executivo">Projeto executivo</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-56">
              <Select value={filterCliente} onValueChange={setFilterCliente}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Clientes</SelectItem>
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
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="pl-6 font-semibold text-slate-600 w-24">Código</TableHead>
                    <TableHead className="font-semibold text-slate-600">Projeto</TableHead>
                    <TableHead className="font-semibold text-slate-600">Cliente</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-right pr-6">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                        <div className="flex justify-center items-center h-full">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Briefcase className="w-10 h-10 mb-3 text-slate-300" />
                          <p className="text-slate-600 font-medium">Nenhum projeto encontrado</p>
                          <p className="text-sm">Tente ajustar seus filtros.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => (
                      <TableRow
                        key={p.id}
                        onClick={() => handleSelect(p.id)}
                        className={cn(
                          'cursor-pointer transition-colors border-l-4',
                          selectedId === p.id
                            ? 'bg-primary/5 border-l-primary hover:bg-primary/10'
                            : 'hover:bg-slate-50/80 border-l-transparent',
                        )}
                      >
                        <TableCell className="pl-6 font-mono text-xs text-slate-500">
                          {p.codigo}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">{p.nome}</TableCell>
                        <TableCell className="text-slate-600 text-sm truncate max-w-[180px]">
                          {p.cliente_nome || '-'}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Badge
                            variant="secondary"
                            className={cn(
                              'font-medium border',
                              p.status === 'Finalizado'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : p.status === 'Projeto executivo'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200',
                            )}
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Detalhes (30%) */}
        <div className="w-full lg:w-[30%]">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
            {!selectedProjeto ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500 min-h-[400px]">
                <Briefcase className="w-12 h-12 mb-4 text-slate-200" />
                <h3 className="font-medium text-slate-900 mb-1">Nenhum projeto selecionado</h3>
                <p className="text-sm">Clique em um projeto na lista para ver seus detalhes.</p>
              </div>
            ) : (
              <div className="flex flex-col min-h-[400px]">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 leading-tight">
                      {selectedProjeto.nome}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 font-mono bg-slate-200/50 inline-block px-1.5 py-0.5 rounded">
                      Cód: {selectedProjeto.codigo}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFormOpen(true)
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1.5" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs text-destructive border-destructive/20 hover:bg-destructive/10 w-full"
                      onClick={(e) => handleArchive(selectedProjeto.id, e)}
                    >
                      <Archive className="h-3 w-3 mr-1.5" />
                      Arquivar
                    </Button>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col space-y-6">
                  {loadingDetails ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <div className="p-3 border rounded-lg space-y-3">
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <div className="p-3 border rounded-lg space-y-3">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Visão Geral Card */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center text-slate-700">
                          <Activity className="w-4 h-4 mr-2 text-slate-400" />
                          Visão Geral
                        </h4>
                        <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 flex items-center">
                              <User className="w-3.5 h-3.5 mr-1.5" /> Cliente
                            </span>
                            <span className="font-medium text-slate-900 text-right truncate pl-2">
                              {selectedProjeto.cliente_nome || '-'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 flex items-center">
                              <Calendar className="w-3.5 h-3.5 mr-1.5" /> Entrada
                            </span>
                            <span className="font-medium text-slate-900">
                              {selectedProjeto.data_entrada
                                ? new Date(selectedProjeto.data_entrada).toLocaleDateString('pt-BR')
                                : '-'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 flex items-center">
                              <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Status
                            </span>
                            <span className="font-medium text-primary">
                              {selectedProjeto.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progresso Estimado Card */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center text-slate-700">
                          <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                          Progresso Estimado
                        </h4>
                        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-sm text-slate-600">
                          <div className="flex items-center justify-between mb-2">
                            <span>Status Atual</span>
                            <span className="font-medium text-slate-900">
                              {selectedProjeto.status === 'Finalizado' ? '100%' : 'Em andamento'}
                            </span>
                          </div>
                          {selectedProjeto.status !== 'Finalizado' && (
                            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                              <div
                                className="bg-primary h-1.5 rounded-full"
                                style={{
                                  width:
                                    selectedProjeto.status === 'Projeto executivo' ? '70%' : '30%',
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProjetoFormDialog
        open={formOpen}
        onOpenChange={(v: boolean) => {
          setFormOpen(v)
          if (!v && !selectedProjeto) fetchProjetos()
        }}
        projeto={selectedProjeto}
        onSuccess={() => {
          fetchProjetos()
          setFormOpen(false)
        }}
      />
    </div>
  )
}
