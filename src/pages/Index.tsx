import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  Briefcase,
  Wrench,
  ArrowRight,
  Activity,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Package,
  HardHat,
  Building2,
  UserCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import useDataStore from '@/stores/use-data-store'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'

export default function Index() {
  const { setActiveModal } = useDataStore()

  const [stats, setStats] = useState<any>(null)
  const [kpis, setKpis] = useState<any>(null)
  const [dcStats, setDcStats] = useState<any>(null)
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const today = new Date().toISOString().split('T')[0]

        const [{ data: statsData }, { data: kpiData }, { data: dcData }, { data: rpData }] =
          await Promise.all([
            supabase.rpc('get_dashboard_stats'),
            supabase.rpc('get_dashboard_kpi', { p_date_now: today }),
            supabase.rpc('stats_datacenter'),
            supabase
              .from('projetos')
              .select('id, nome, status, updated_at')
              .order('updated_at', { ascending: false })
              .limit(5),
          ])

        setStats(statsData || {})
        setKpis(kpiData || {})
        setDcStats(dcData || {})
        setRecentProjects(rpData || [])
      } catch (e) {
        console.error('Error fetching dashboard data:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  const StatCard = ({ title, value, icon: Icon, color, loading }: any) => (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className={`p-2 rounded-md ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24 mt-1" />
        ) : (
          <div className="text-2xl md:text-3xl font-bold text-slate-900">{value}</div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Visão Geral
          </h1>
          <p className="text-slate-500">Acompanhamento em tempo real da Lucenera.</p>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Saldo Total"
          value={formatCurrency(kpis?.totalBalance)}
          icon={DollarSign}
          color="bg-blue-100 text-blue-700"
          loading={loading}
        />
        <StatCard
          title="Receitas do Mês"
          value={formatCurrency(kpis?.monthIncome)}
          icon={TrendingUp}
          color="bg-emerald-100 text-emerald-700"
          loading={loading}
        />
        <StatCard
          title="Despesas do Mês"
          value={formatCurrency(kpis?.monthExpense)}
          icon={TrendingDown}
          color="bg-rose-100 text-rose-700"
          loading={loading}
        />
        <StatCard
          title="Valor em Projetos"
          value={formatCurrency(stats?.totalValue)}
          icon={Briefcase}
          color="bg-amber-100 text-amber-700"
          loading={loading}
        />
      </div>

      {/* Operational & CRM KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Projetos Ativos"
          value={stats?.activeProjects || 0}
          icon={Activity}
          color="bg-indigo-100 text-indigo-700"
          loading={loading}
        />
        <StatCard
          title="Concluídos no Mês"
          value={stats?.completedThisMonth || 0}
          icon={CheckCircle2}
          color="bg-teal-100 text-teal-700"
          loading={loading}
        />
        <StatCard
          title="Total de Clientes"
          value={stats?.clientsCount || 0}
          icon={Users}
          color="bg-cyan-100 text-cyan-700"
          loading={loading}
        />
        <StatCard
          title="Separações Pendentes"
          value={dcStats?.separacoes || 0}
          icon={Package}
          color="bg-orange-100 text-orange-700"
          loading={loading}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
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

          {/* More Datacenter Stats */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-400" /> Estatísticas Operacionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <UserCircle className="w-8 h-8 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Funcionários</p>
                      <p className="text-xl font-bold text-slate-900">
                        {dcStats?.funcionarios || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <HardHat className="w-8 h-8 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Arq / Eng</p>
                      <p className="text-xl font-bold text-slate-900">
                        {(stats?.architectsCount || 0) + (stats?.engineersCount || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg col-span-2">
                    <Wrench className="w-8 h-8 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Marcas Ativas</p>
                      <p className="text-xl font-bold text-slate-900">{dcStats?.marcas || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-400" /> Projetos Recentes
            </CardTitle>
            <CardDescription>Últimas modificações de projetos no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="w-2 h-2 rounded-full mt-1.5 shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))
              ) : recentProjects.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Nenhum projeto modificado recentemente.
                </p>
              ) : (
                recentProjects.map((proj) => (
                  <div key={proj.id} className="flex items-start gap-4 text-sm group">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 shrink-0" />
                    <div className="flex-1">
                      <Link
                        to="/projetos"
                        className="text-slate-900 font-medium hover:text-amber-600 transition-colors"
                      >
                        {proj.nome}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                          {proj.status || 'Sem status'}
                        </span>
                        <span className="text-slate-400 text-xs">
                          {new Date(proj.updated_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link
                to="/projetos"
                className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center justify-center group"
              >
                Ver todos os projetos
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
