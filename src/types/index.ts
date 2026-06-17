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
  numero?: string
  bairro?: string
  cep?: string
  cidade?: string
  estado?: string

  cep_entrega?: string
  endereco_entrega?: string
  numero_entrega?: string
  bairro_entrega?: string
  cidade_entrega?: string
  estado_entrega?: string

  cep_cobranca?: string
  endereco_cobranca?: string
  numero_cobranca?: string
  bairro_cobranca?: string
  cidade_cobranca?: string
  estado_cobranca?: string

  inscricao_estadual?: string
  inscricao_municipal?: string
  limite_credito?: number
  regime_apuracao?: string
  email_alternativo?: string
  vendedor_id?: string

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
