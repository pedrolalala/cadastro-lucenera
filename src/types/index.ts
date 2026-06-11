export type Cliente = {
  id: string
  tipo: 'Cliente' | string
  nome: string
  name: string // legacy
  tipo_pessoa: 'Física' | 'Jurídica'
  cpf?: string
  rg?: string
  data_nascimento?: string
  cnpj?: string
  razao_social?: string
  nome_empresa?: string
  company: string // legacy
  email: string
  email_financeiro?: string
  telefone?: string
  phone: string // legacy
  celular?: string
  endereco?: string
  bairro?: string
  cep?: string
  cidade?: string
  estado?: string
  observacoes?: string
  ativo: boolean
  status: 'Ativo' | 'Inativo' // legacy
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
