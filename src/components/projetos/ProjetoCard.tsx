import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Calendar, Building, Edit, Trash } from 'lucide-react'
import { Projeto, Cliente } from '@/types'
import useDataStore from '@/stores/use-data-store'

export function ProjetoCard({ projeto, cliente }: { projeto: Projeto; cliente?: Cliente }) {
  const { setActiveModal, deleteProjeto } = useDataStore()

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Concluído':
        return 'bg-emerald-100 text-emerald-700'
      case 'Em Andamento':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const handleDelete = () => {
    if (window.confirm('Excluir este projeto?')) deleteProjeto(projeto.id)
  }

  return (
    <Card className="flex flex-col hover:shadow-md transition-all duration-200 border-slate-200 group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg leading-tight text-slate-900 group-hover:text-amber-600 transition-colors">
            {projeto.name}
          </CardTitle>
          <Badge
            className={`${getStatusColor(projeto.status)} border-0 hover:bg-opacity-80 whitespace-nowrap`}
          >
            {projeto.status}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-2">
          <Building className="w-3.5 h-3.5" />
          <span className="truncate">{cliente?.company || 'Cliente não encontrado'}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 line-clamp-2 min-h-[2.5rem]">
            {projeto.description || 'Sem descrição.'}
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Progresso</span>
              <span>{projeto.progress}%</span>
            </div>
            <Progress value={projeto.progress} className="h-2" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex items-center justify-between border-t border-slate-100 mt-4 px-6 py-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(projeto.deadline).toLocaleDateString('pt-BR')}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-amber-600"
            onClick={() => setActiveModal('projeto', projeto.id)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-red-600"
            onClick={handleDelete}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
