export type Cliente = {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: 'Ativo' | 'Inativo'
  createdAt: string
}

export type Projeto = {
  id: string
  name: string
  deadline: string
  status: 'Pendente' | 'Em Andamento' | 'Concluído'
  progress: number
  clientId: string
  description: string
  createdAt: string
}

export type Peca = {
  id: string
  sku: string
  name: string
  specs: string
  stock: number
  image: string
  createdAt: string
}

export type ActivityItem = {
  id: string
  type: 'Cliente' | 'Projeto' | 'Peça'
  action: 'Criado' | 'Atualizado'
  itemName: string
  timestamp: string
}
