import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
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
import { Search, Filter, Edit, Trash, Eye } from 'lucide-react'
import useDataStore from '@/stores/use-data-store'
import { ClienteDetailsSheet } from '@/components/clientes/ClienteDetailsSheet'

export default function Clientes() {
  const { clientes, setActiveModal, deleteCliente } = useDataStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<'Todos' | 'Física' | 'Jurídica'>('Todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const filtered = useMemo(() => {
    return clientes.filter((c) => {
      if (c.tipo !== 'Cliente') return false
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        c.nome?.toLowerCase().includes(term) ||
        c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
      const matchesTipo = tipoFiltro === 'Todos' || c.tipo_pessoa === tipoFiltro
      return matchesSearch && matchesTipo
    })
  }, [clientes, searchTerm, tipoFiltro])

  const handleViewDetails = (id: string) => {
    setSelectedId(id)
    setIsSheetOpen(true)
  }

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveModal('cliente', id)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteCliente(id)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Clientes</h1>
          <p className="text-slate-500">Gerencie a carteira de clientes físicos e jurídicos.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white">
                <Filter className="w-4 h-4 mr-2" />
                {tipoFiltro}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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

      <Card className="border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo Pessoa</TableHead>
              <TableHead className="hidden sm:table-cell">E-mail</TableHead>
              <TableHead className="hidden lg:table-cell">Telefone</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="font-medium text-slate-900">
                    <div className="flex flex-col">
                      <span>{c.nome || c.name}</span>
                      {!c.ativo && (
                        <span className="text-[10px] text-red-500 font-semibold uppercase">
                          Inativo
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                      {c.tipo_pessoa}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-slate-600">
                    {c.email || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-slate-600">
                    {c.celular || c.telefone || c.phone || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(c.id)}
                        title="Visualizar Detalhes"
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleEdit(c.id, e)}
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(c.id, e)}
                        title="Deletar"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <ClienteDetailsSheet id={selectedId} open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </div>
  )
}
