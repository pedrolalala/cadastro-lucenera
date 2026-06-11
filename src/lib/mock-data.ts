import { Cliente, Projeto, Peca, ActivityItem } from '@/types'

export const MOCK_CLIENTES: Cliente[] = [
  {
    id: 'c1',
    name: 'João Silva',
    email: 'joao@techcorp.br',
    phone: '(11) 98888-1111',
    company: 'TechCorp Brasil',
    status: 'Ativo',
    createdAt: new Date(Date.now() - 10000000).toISOString(),
  },
  {
    id: 'c2',
    name: 'Maria Souza',
    email: 'maria@industrias.com',
    phone: '(21) 97777-2222',
    company: 'Indústrias Souza',
    status: 'Ativo',
    createdAt: new Date(Date.now() - 20000000).toISOString(),
  },
  {
    id: 'c3',
    name: 'Carlos Santos',
    email: 'carlos@global.com',
    phone: '(31) 96666-3333',
    company: 'Global Logistics',
    status: 'Inativo',
    createdAt: new Date(Date.now() - 30000000).toISOString(),
  },
]

export const MOCK_PROJETOS: Projeto[] = [
  {
    id: 'p1',
    name: 'Sistema de Refrigeração Industrial',
    deadline: '2026-10-15',
    status: 'Em Andamento',
    progress: 65,
    clientId: 'c2',
    description: 'Instalação completa de refrigeradores de alta capacidade.',
    createdAt: new Date(Date.now() - 5000000).toISOString(),
  },
  {
    id: 'p2',
    name: 'Manutenção de Turbinas',
    deadline: '2026-08-01',
    status: 'Pendente',
    progress: 10,
    clientId: 'c3',
    description: 'Revisão anual das turbinas primárias.',
    createdAt: new Date(Date.now() - 8000000).toISOString(),
  },
  {
    id: 'p3',
    name: 'Instalação Elétrica Q3',
    deadline: '2026-07-20',
    status: 'Concluído',
    progress: 100,
    clientId: 'c1',
    description: 'Renovação do quadro elétrico do setor sul.',
    createdAt: new Date(Date.now() - 12000000).toISOString(),
  },
]

export const MOCK_PECAS: Peca[] = [
  {
    id: 'pc1',
    sku: 'VAL-001',
    name: 'Válvula de Pressão X1',
    specs: 'Latão, 500 PSI, Rosca 1/2"',
    stock: 45,
    image: 'https://img.usecurling.com/p/200/200?q=metal%20valve&color=gray',
    createdAt: new Date(Date.now() - 1000000).toISOString(),
  },
  {
    id: 'pc2',
    sku: 'MOT-200',
    name: 'Motor Elétrico 200W',
    specs: 'Bifásico, 220V, 3000 RPM',
    stock: 12,
    image: 'https://img.usecurling.com/p/200/200?q=electric%20motor&color=black',
    createdAt: new Date(Date.now() - 2000000).toISOString(),
  },
  {
    id: 'pc3',
    sku: 'FIL-B2',
    name: 'Filtro de Ar B2',
    specs: 'Malha fina, Uso industrial',
    stock: 0,
    image: 'https://img.usecurling.com/p/200/200?q=air%20filter&color=white',
    createdAt: new Date(Date.now() - 3000000).toISOString(),
  },
]

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'a1',
    type: 'Peça',
    action: 'Criado',
    itemName: 'Filtro de Ar B2',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'a2',
    type: 'Projeto',
    action: 'Atualizado',
    itemName: 'Sistema de Refrigeração',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'a3',
    type: 'Cliente',
    action: 'Criado',
    itemName: 'TechCorp Brasil',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
]
