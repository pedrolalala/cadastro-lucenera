import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Briefcase, Wrench, ArrowRight, Activity, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import useDataStore from '@/stores/use-data-store'

export default function Index() {
  const { clientes, projetos, pecas, activities, setActiveModal } = useDataStore()

  const stats = [
    {
      title: 'Total de Clientes',
      value: clientes.length,
      icon: Users,
      link: '/clientes',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Projetos Ativos',
      value: projetos.filter((p) => p.status === 'Em Andamento').length,
      icon: Briefcase,
      link: '/projetos',
      color: 'bg-amber-100 text-amber-700',
    },
    {
      title: 'Peças em Estoque',
      value: pecas.reduce((acc, curr) => acc + curr.stock, 0),
      icon: Wrench,
      link: '/pecas',
      color: 'bg-emerald-100 text-emerald-700',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Visão Geral
          </h1>
          <p className="text-slate-500">Resumo das atividades da Lucenera.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
              <div className={`p-2 rounded-md ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              <Link
                to={stat.link}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center mt-2 group"
              >
                Ver detalhes{' '}
                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Links */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-slate-400" /> Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button
              variant="outline"
              className="justify-start h-12"
              onClick={() => setActiveModal('cliente')}
            >
              <Users className="w-4 h-4 mr-3 text-blue-600" /> Cadastrar Novo Cliente
            </Button>
            <Button
              variant="outline"
              className="justify-start h-12"
              onClick={() => setActiveModal('projeto')}
            >
              <Briefcase className="w-4 h-4 mr-3 text-amber-600" /> Iniciar Novo Projeto
            </Button>
            <Button
              variant="outline"
              className="justify-start h-12"
              onClick={() => setActiveModal('peca')}
            >
              <Wrench className="w-4 h-4 mr-3 text-emerald-600" /> Adicionar Peça ao Estoque
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-400" /> Atividade Recente
            </CardTitle>
            <CardDescription>Últimas modificações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Nenhuma atividade recente.
                </p>
              ) : (
                activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="flex items-start gap-4 text-sm">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-slate-900 font-medium">
                        {act.type} {act.action.toLowerCase()}:{' '}
                        <span className="text-slate-600">{act.itemName}</span>
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {new Date(act.timestamp).toLocaleDateString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
