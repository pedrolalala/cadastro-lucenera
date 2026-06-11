import { useState } from 'react'
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
import { Search } from 'lucide-react'
import useDataStore from '@/stores/use-data-store'
import { ClienteDetailsSheet } from '@/components/clientes/ClienteDetailsSheet'

export default function Clientes() {
  const { clientes } = useDataStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const filtered = clientes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleRowClick = (id: string) => {
    setSelectedId(id)
    setIsSheetOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Clientes</h1>
          <p className="text-slate-500">Gerencie a carteira de contatos.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar por nome ou empresa..."
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Empresa</TableHead>
              <TableHead className="hidden sm:table-cell">E-mail</TableHead>
              <TableHead className="hidden lg:table-cell">Telefone</TableHead>
              <TableHead>Status</TableHead>
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
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                  onClick={() => handleRowClick(c.id)}
                >
                  <TableCell className="font-medium text-slate-900">{c.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-slate-600">{c.company}</TableCell>
                  <TableCell className="hidden sm:table-cell text-slate-600">{c.email}</TableCell>
                  <TableCell className="hidden lg:table-cell text-slate-600">{c.phone}</TableCell>
                  <TableCell>
                    <Badge
                      variant={c.status === 'Ativo' ? 'default' : 'secondary'}
                      className={
                        c.status === 'Ativo'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : ''
                      }
                    >
                      {c.status}
                    </Badge>
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
