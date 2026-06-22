import { useState, useMemo, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Filter,
  Edit,
  Trash2,
  User,
  Building2,
  MapPin,
  Phone,
  Mail,
  FileText,
  Plus,
} from 'lucide-react'
import useDataStore from '@/stores/use-data-store'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export default function Clientes() {
  const { clientes, clientesLoading, fetchClientes, setActiveModal, deleteCliente } = useDataStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<'Todos' | 'Física' | 'Jurídica'>('Todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  const filtered = useMemo(() => {
    return clientes.filter((c: any) => {
      const term = searchTerm.toLowerCase()
      const nome = (c.nome || c.name || '').toLowerCase()
      const email = (c.email || '').toLowerCase()
      const matchesSearch = nome.includes(term) || email.includes(term)
      const matchesTipo = tipoFiltro === 'Todos' || c.tipo_pessoa === tipoFiltro
      return matchesSearch && matchesTipo
    })
  }, [clientes, searchTerm, tipoFiltro])

  const selectedCliente = useMemo(() => {
    return clientes.find((c: any) => c.id === selectedId) || null
  }, [clientes, selectedId])

  const handleSelect = (id: string) => {
    if (selectedId === id) return
    setLoadingDetails(true)
    setSelectedId(id)
    setTimeout(() => {
      setLoadingDetails(false)
    }, 300)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      await deleteCliente(id)
      if (selectedId === id) setSelectedId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie a carteira de clientes físicos e jurídicos.
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm w-full sm:w-auto"
          onClick={() => setActiveModal('cliente')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Lista (70%) */}
        <div className="w-full lg:w-[70%] space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-slate-50 border-slate-200"
                  >
                    <Filter className="w-4 h-4 mr-2 text-slate-400" />
                    {tipoFiltro}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setTipoFiltro('Todos')}>Todos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTipoFiltro('Física')}>
                    Pessoa Física
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTipoFiltro('Jurídica')}>
                    Pessoa Jurídica
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="pl-6 font-semibold text-slate-600">Nome</TableHead>
                    <TableHead className="font-semibold text-slate-600">Tipo</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold text-slate-600">
                      E-mail
                    </TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-slate-600">
                      Telefone
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesLoading ? (
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
                          <User className="w-10 h-10 mb-3 text-slate-300" />
                          <p className="text-slate-600 font-medium">Nenhum cliente encontrado</p>
                          <p className="text-sm">Tente ajustar seus filtros.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((c: any) => (
                      <TableRow
                        key={c.id}
                        onClick={() => handleSelect(c.id)}
                        className={cn(
                          'cursor-pointer transition-colors border-l-4',
                          selectedId === c.id
                            ? 'bg-primary/5 border-l-primary hover:bg-primary/10'
                            : 'hover:bg-slate-50/80 border-l-transparent',
                        )}
                      >
                        <TableCell className="pl-6 font-medium text-slate-900">
                          <div className="flex flex-col">
                            <span>{c.nome || c.name}</span>
                            {!c.ativo && (
                              <span className="text-[10px] text-destructive font-semibold uppercase mt-0.5">
                                Inativo
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-600 border-slate-200"
                          >
                            {c.tipo_pessoa === 'Jurídica' ? (
                              <Building2 className="w-3 h-3 mr-1" />
                            ) : (
                              <User className="w-3 h-3 mr-1" />
                            )}
                            {c.tipo_pessoa || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-slate-500 text-sm">
                          {c.email || '-'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-slate-500 text-sm">
                          {c.telefone || c.celular || c.phone || '-'}
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
            {!selectedCliente ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500 min-h-[400px]">
                <User className="w-12 h-12 mb-4 text-slate-200" />
                <h3 className="font-medium text-slate-900 mb-1">Nenhum cliente selecionado</h3>
                <p className="text-sm">Clique em um cliente na lista para ver seus detalhes.</p>
              </div>
            ) : (
              <div className="flex flex-col min-h-[400px]">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 leading-tight">
                      {selectedCliente.nome || selectedCliente.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 font-mono bg-slate-200/50 inline-block px-1.5 py-0.5 rounded">
                      {selectedCliente.cpf_cnpj || 'Sem CPF/CNPJ'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 text-white h-8 text-xs w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveModal('cliente', selectedCliente.id)
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1.5" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs text-destructive border-destructive/20 hover:bg-destructive/10 w-full"
                      onClick={(e) => handleDelete(selectedCliente.id, e)}
                    >
                      <Trash2 className="h-3 w-3 mr-1.5" />
                      Excluir
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
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <div className="p-3 border rounded-lg space-y-3">
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Contato Card */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center text-slate-700">
                          <Phone className="w-4 h-4 mr-2 text-slate-400" />
                          Contato
                        </h4>
                        <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3 text-sm">
                          <div className="flex items-start gap-3">
                            <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <span className="text-slate-600 break-all">
                              {selectedCliente.email || 'Não informado'}
                            </span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <span className="text-slate-600">
                              {selectedCliente.telefone ||
                                selectedCliente.celular ||
                                selectedCliente.phone ||
                                'Não informado'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Endereço Card */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center text-slate-700">
                          <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                          Endereço
                        </h4>
                        <div className="border border-slate-200 rounded-lg p-3 bg-white text-sm text-slate-600">
                          {selectedCliente.endereco || selectedCliente.cidade ? (
                            <div className="space-y-1">
                              <p>{selectedCliente.endereco}</p>
                              <p>
                                {[selectedCliente.cidade, selectedCliente.estado]
                                  .filter(Boolean)
                                  .join(' - ')}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Não informado</span>
                          )}
                        </div>
                      </div>

                      {/* Observações Card */}
                      {selectedCliente.observacoes && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold flex items-center text-slate-700">
                            <FileText className="w-4 h-4 mr-2 text-slate-400" />
                            Observações
                          </h4>
                          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-sm text-slate-600 whitespace-pre-wrap">
                            {selectedCliente.observacoes}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
