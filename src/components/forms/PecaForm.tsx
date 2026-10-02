import { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
// SPEC-174 N6b: mesma função usada em PecaDetailsPanel.tsx pra agrupar
// estoque_itens por setor (local), reaproveitada aqui pra listar os setores
// reais do produto em vez de só repetir as linhas cruas de getEstoqueItens.
import { buildSetoresObrigatorios, type SetoresSaldosProjeto } from '@/lib/estoque-sectors'
// SPEC-174 N6c: mesma lista vertical dos 8 setores obrigatórios do painel.
import { EstoqueSetoresList } from '@/components/pecas/EstoqueSetoresList'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
// SPEC-174 N7: Excluir/Copiar só aparecem com a ação "editar" no Cadastro.
import { useAuth } from '@/hooks/use-auth'
import {
  getProduto,
  createProduto,
  updateProduto,
  deleteProduto,
  checkSkuExists,
  getFornecedores,
  getMarcas,
  getCategoriasProduto,
  getEstoqueItens,
  getSetoresProduto,
  createMarca,
  createFornecedor,
} from '@/services/produtos'

// Bug achado em QA (2026-08-25): SKU_PREFIX era 'teste' — toda peça nova
// criada sem referência manual ganhava "teste01", "teste02" etc. como
// referência permanente. Removido o auto-preenchimento (ver useEffect
// abaixo); o campo Referência começa vazio em peça nova.

const schema = z.object({
  sku: z.string().optional(),
  nome: z.string().min(2, 'Obrigatório'),
  marca_id: z.string().min(1, 'Obrigatório'),
  categoria_id: z.string().min(1, 'Obrigatório'),
  fornecedor_principal_id: z.string().optional().or(z.literal('none')).or(z.literal('')),
  unidade: z.string().min(1, 'Obrigatório').default('UN'),
  referencia: z.string().optional(),
  descricao_tecnica: z.string().optional(),
  preco_custo: z.coerce.number().min(0, 'Inválido'),
  preco_venda: z.coerce.number().min(0, 'Inválido'),
  valor_venda: z.coerce.number().min(0).optional().default(0),
  ncm: z.string().max(10).optional(),
  tipo_fiscal: z.string().optional(),
  ativo: z.boolean().default(true),
  porc_frete: z.coerce.number().min(0).optional().default(0),
  porc_despesas: z.coerce.number().min(0).optional().default(0),
  porc_bdi: z.coerce.number().min(0).optional().default(0),
  porc_st: z.coerce.number().min(0).optional().default(0),
  margem_lucro: z.coerce.number().min(0).optional().default(150),
  custo_total: z.coerce.number().min(0).optional().default(0),
  cst: z.string().optional().default(''),
  cest: z.string().optional().default(''),
  icms_entrada: z.coerce.number().min(0).optional().default(0),
  ipi_entrada: z.coerce.number().min(0).optional().default(0),
  mascara_produto: z.string().optional().default(''),
  status_comercial: z.string().optional().default('Normal'),
})
type FormData = z.infer<typeof schema>

const InputField = ({ control, name, label, type = 'text', readOnly = false }: any) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className="space-y-0.5">
        <FormLabel className="text-xs">{label}</FormLabel>
        <FormControl>
          <Input
            type={type}
            readOnly={readOnly}
            step={type === 'number' ? '0.01' : undefined}
            // SPEC-158 (P2.5, seguimento): o anel de foco padrão usa
            // --ring (laranja da marca, main.css) -- pedido do usuário pra
            // deixar preto na tela de Editar Peça, mesmo padrão já aplicado
            // nas divisórias das seções.
            className="h-7 text-sm focus-visible:ring-slate-900"
            {...field}
          />
        </FormControl>
        <FormMessage className="text-[10px]" />
      </FormItem>
    )}
  />
)

const SelectField = ({ control, name, label, options, extra }: any) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => {
      // Bug achado em QA (2026-08-25): quando o valor do campo é setado via
      // form.reset() (edição de peça existente) antes do usuário nunca ter
      // aberto o dropdown, o Radix Select não sabe ainda qual label mostrar
      // pro value já selecionado (o texto só é registrado quando o
      // SelectContent monta, o que só acontece ao abrir) — o trigger ficava
      // mostrando "Selecione..." mesmo com marca/categoria já definidas.
      // Resolvido passando o label já resolvido como children de SelectValue,
      // em vez de depender da resolução automática do Radix.
      const selected = options.find(
        (o: any) => String(o.id ?? o.value ?? o.nome) === String(field.value),
      )
      return (
        <FormItem className="space-y-0.5">
          <FormLabel className="text-xs">{label}</FormLabel>
          <div className="flex items-center gap-1">
            <div className="flex-1 min-w-0">
              <Select
                onValueChange={field.onChange}
                value={field.value ? String(field.value) : undefined}
              >
                <FormControl>
                  <SelectTrigger className="h-7 text-sm">
                    <SelectValue placeholder="Selecione...">
                      {selected ? selected.nome || selected.label : undefined}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options.map((o: any) => (
                    <SelectItem
                      key={o.id || o.value || o.nome}
                      value={String(o.id || o.value || o.nome)}
                    >
                      {o.nome || o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {extra}
          </div>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )
    }}
  />
)

type FornecedorOption = { id: string; nome: string; razao_social: string | null }
type MarcaOption = { id: string; nome: string }

// SPEC-053: modal simples de criação rápida de marca, aberto pelo botão "+"
// ao lado do SelectField de Marca em PecaForm. Não sai do formulário de
// produto. fornecedor_id/prazo_entrega_dias são opcionais.
function MarcaQuickCreateDialog({
  open,
  onOpenChange,
  fornecedores,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  fornecedores: FornecedorOption[]
  onCreated: (marca: MarcaOption) => void
}) {
  const { toast } = useToast()
  const [nome, setNome] = useState('')
  const [fornecedorId, setFornecedorId] = useState('none')
  const [prazoEntregaDias, setPrazoEntregaDias] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setNome('')
      setFornecedorId('none')
      setPrazoEntregaDias('')
    }
  }, [open])

  const handleSave = useCallback(async () => {
    if (!nome.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const marca = await createMarca({
        nome,
        fornecedor_id: fornecedorId === 'none' ? null : fornecedorId,
        prazo_entrega_dias: prazoEntregaDias ? Number(prazoEntregaDias) : null,
      })
      toast({ title: 'Marca criada', description: marca.nome })
      onCreated(marca)
      onOpenChange(false)
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.message || 'Falha ao criar marca',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }, [nome, fornecedorId, prazoEntregaDias, onCreated, onOpenChange, toast])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Marca</DialogTitle>
          <DialogDescription>Cadastro rápido, sem sair do formulário de produto.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Nome *</label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Fornecedor</label>
            <Select value={fornecedorId} onValueChange={setFornecedorId}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.razao_social || f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Prazo de entrega (dias)</label>
            <Input
              type="number"
              min="0"
              value={prazoEntregaDias}
              onChange={(e) => setPrazoEntregaDias(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Marca'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// SPEC-053: modal simples de criação rápida de fornecedor (contatos.tipo =
// 'fornecedor'), aberto pelo botão "+" ao lado do SelectField de Fornecedor.
function FornecedorQuickCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (fornecedor: FornecedorOption) => void
}) {
  const { toast } = useToast()
  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [razaoSocial, setRazaoSocial] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setNome('')
      setCnpj('')
      setRazaoSocial('')
    }
  }, [open])

  const handleSave = useCallback(async () => {
    if (!nome.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const fornecedor = await createFornecedor({
        nome,
        cnpj: cnpj || null,
        razao_social: razaoSocial || null,
      })
      toast({ title: 'Fornecedor criado', description: fornecedor.nome })
      onCreated(fornecedor as FornecedorOption)
      onOpenChange(false)
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.message || 'Falha ao criar fornecedor',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }, [nome, cnpj, razaoSocial, onCreated, onOpenChange, toast])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Fornecedor</DialogTitle>
          <DialogDescription>Cadastro rápido, sem sair do formulário de produto.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Nome *</label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Razão Social</label>
            <Input
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">CNPJ</label>
            <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Fornecedor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PecaForm({
  pecaId,
  onSuccess,
  onCopy,
}: {
  pecaId?: string | null
  onSuccess: () => void
  // SPEC-158 (P3.1, 2026-09-22, marcado "urgente" pelo usuário): "copiar
  // produto" -- quase nunca se cadastra uma peça do zero, quase sempre se
  // parte de uma parecida ("da Evoled, da Interlight... eu vou vir aqui,
  // ó, 3649, e vou copiar"). Implementado SEM buscar dados de novo: o
  // formulário já está carregado com a peça de origem (pecaId aponta pra
  // ela); "Copiar" só avisa o pai (via este callback) pra trocar
  // editingId -> null, mantendo TODOS os valores já preenchidos no form
  // intactos (React não remonta o componente, só troca a prop `pecaId`).
  // codigo_produto novo vem do DEFAULT nextval (createProduto, ramo
  // pecaId=null) -- nunca copiado. `onCopy` é opcional pra não quebrar
  // nenhum outro lugar que já use PecaForm sem esse recurso.
  onCopy?: () => void
}) {
  const { toast } = useToast()
  // SPEC-174 N7: todo mundo com acesso ao Cadastro chega até aqui (consulta);
  // Excluir/Copiar só aparecem para quem tem a ação "editar".
  const { canEdit } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([])
  const [marcas, setMarcas] = useState<MarcaOption[]>([])
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([])
  const [estoqueItens, setEstoqueItens] = useState<any[]>([])
  // SPEC-053: codigo_produto não é mais editável nem parte do form — é
  // gerado pelo DEFAULT nextval(produtos_codigo_produto_seq) da coluna.
  // Aqui só guardamos o valor para exibição (existente ao editar).
  const [codigoProdutoAtual, setCodigoProdutoAtual] = useState<number | null>(null)
  // SPEC-174 N6b: estoque_showroom nunca aparece em estoque_itens (mesmo
  // motivo documentado em PecaDetailsPanel.tsx -- o trigger
  // fn_sync_estoque_itens_from_produtos zera essa linha). Guardado aqui só
  // pra exibição no bloco "Estoque Integrado", igual ao painel lateral.
  const [estoqueShowroomAtual, setEstoqueShowroomAtual] = useState<number>(0)
  // SPEC-174 N6c: Reserva/Separação/Entrega Futura da peça (saldos por projeto).
  const [setoresSaldosForm, setSetoresSaldosForm] = useState<SetoresSaldosProjeto | null>(null)
  const [marcaModalOpen, setMarcaModalOpen] = useState(false)
  const [fornecedorModalOpen, setFornecedorModalOpen] = useState(false)
  // SPEC-115: excluir peça saiu do painel rápido da listagem (clique
  // acidental apagava direto) — fica só aqui dentro da edição completa.
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!pecaId) return
    setDeleting(true)
    try {
      await deleteProduto(pecaId)
      toast({ title: 'Sucesso', description: 'Peça removida com sucesso!' })
      onSuccess()
    } catch {
      toast({
        title: 'Erro',
        description: 'Falha ao remover a peça.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sku: '',
      nome: '',
      marca_id: '',
      categoria_id: '',
      fornecedor_principal_id: 'none',
      unidade: 'UN',
      referencia: '',
      descricao_tecnica: '',
      preco_custo: 0,
      preco_venda: 0,
      valor_venda: 0,
      ncm: '',
      tipo_fiscal: '',
      ativo: true,
      porc_frete: 0,
      porc_despesas: 0,
      porc_bdi: 0,
      porc_st: 0,
      margem_lucro: 150,
      custo_total: 0,
      cst: '',
      cest: '',
      icms_entrada: 0,
      ipi_entrada: 0,
      mascara_produto: '',
      status_comercial: 'Normal',
    },
  })

  const { watch, setValue, getValues } = form

  const parseNum = useCallback((val: any) => {
    const num = Number(val)
    return isNaN(num) ? 0 : num
  }, [])

  const pCusto = parseNum(watch('preco_custo'))
  const pST = parseNum(watch('porc_st'))
  const pIPI = parseNum(watch('ipi_entrada'))
  const pFrete = parseNum(watch('porc_frete'))
  const mLucro = parseNum(watch('margem_lucro'))

  useEffect(() => {
    const calcBdi = pCusto * (pST / 100) + pCusto * (pIPI / 100)
    const calcCustoTotal = pCusto + calcBdi + pCusto * (pFrete / 100)

    const mLucroToApply =
      mLucro === 0 && getValues('margem_lucro') === 0 && pecaId === null ? 150 : mLucro
    const calcVenda = calcCustoTotal * (1 + mLucroToApply / 100)

    const formattedBdi = Number(calcBdi.toFixed(2))
    const formattedCustoTotal = Number(calcCustoTotal.toFixed(2))
    const formattedVenda = Number(calcVenda.toFixed(2))

    if (getValues('porc_bdi') !== formattedBdi)
      setValue('porc_bdi', formattedBdi, { shouldValidate: true, shouldDirty: true })
    if (getValues('custo_total') !== formattedCustoTotal)
      setValue('custo_total', formattedCustoTotal, { shouldValidate: true, shouldDirty: true })
    if (getValues('preco_venda') !== formattedVenda)
      setValue('preco_venda', formattedVenda, { shouldValidate: true, shouldDirty: true })
    if (getValues('valor_venda') !== formattedVenda)
      setValue('valor_venda', formattedVenda, { shouldValidate: true, shouldDirty: true })
  }, [pCusto, pST, pIPI, pFrete, mLucro, setValue, getValues, pecaId])

  useEffect(() => {
    Promise.all([getFornecedores(), getMarcas(), getCategoriasProduto()]).then(([f, m, c]) => {
      setFornecedores(f)
      setMarcas(m)
      setCategorias(c)
    })
    if (pecaId) {
      // SPEC-174 N6c: os saldos por projeto não podem travar o formulário se
      // falharem -- caem em zeros.
      Promise.all([
        getProduto(pecaId),
        getEstoqueItens(pecaId),
        getSetoresProduto(pecaId).catch(() => null),
      ]).then(([data, estq, saldos]) => {
        setEstoqueItens(estq || [])
        setSetoresSaldosForm(saldos)
        setCodigoProdutoAtual((data as any).codigo_produto ?? null)
        setEstoqueShowroomAtual(Number((data as any).estoque_showroom) || 0)
        form.reset({
          ...data,
          fornecedor_principal_id: data.fornecedor_principal_id || 'none',
          ativo: data.ativo ?? true,
          porc_frete: (data as any).porc_frete || 0,
          porc_bdi: (data as any).porc_bdi || 0,
          porc_st: (data as any).porc_st || 0,
          valor_venda: (data as any).valor_venda || (data as any).preco_venda || 0,
          // Bug achado em QA (2026-08-25): campos string opcionais no schema
          // usam z.string().optional(), que só aceita undefined — quando a
          // coluna vem null do banco, o zod rejeitava com "Invalid input" e
          // travava o Salvar silenciosamente (sem mensagem visível até rolar
          // até o campo). sku/referencia/descricao_tecnica/ncm/tipo_fiscal
          // precisam do mesmo fallback que cst/cest/mascara_produto/
          // status_comercial já tinham.
          sku: (data as any).sku || '',
          referencia: (data as any).referencia || '',
          descricao_tecnica: (data as any).descricao_tecnica || '',
          ncm: (data as any).ncm || '',
          tipo_fiscal: (data as any).tipo_fiscal || '',
          cst: (data as any).cst || '',
          cest: (data as any).cest || '',
          mascara_produto: (data as any).mascara_produto || '',
          status_comercial: (data as any).status_comercial || 'Normal',
        } as FormData)
        // Bug achado em QA (2026-08-25): form.reset() atualizava
        // control._defaultValues.marca_id/categoria_id corretamente, mas os
        // Controllers dos SelectField (marca_id/categoria_id) continuavam
        // com _formValues vazio ("") — o dropdown ficava em branco e o
        // Salvar bloqueava com "Obrigatório" mesmo a peça já tendo
        // marca/categoria definidas. setValue() chamado no mesmo tick do
        // reset() não bastava (reset com resolver zod reprocessa validação
        // de forma assíncrona e sobrescrevia o setValue) — precisa rodar
        // depois, daí o setTimeout 0.
        setTimeout(() => {
          form.setValue('marca_id', (data as any).marca_id || '', { shouldValidate: false })
          form.setValue('categoria_id', (data as any).categoria_id || '', { shouldValidate: false })
        }, 0)
      })
    } else {
      setCodigoProdutoAtual(null)
      // Achado no revisor do P3.1 (SPEC-158): sem isso, o painel "Estoque
      // Integrado" continua mostrando o estoque real do produto de origem
      // após clicar "Copiar", como se já pertencesse ao produto novo.
      setEstoqueItens([])
      setEstoqueShowroomAtual(0)
      setSetoresSaldosForm(null)
    }
  }, [pecaId, form])

  // SPEC-174 N6b/N6c: "Estoque Integrado" na vertical com os 8 setores
  // obrigatórios (sempre visíveis, mesmo zerados) + setores extras com saldo —
  // mesma montagem do painel da peça selecionada (PecaDetailsPanel.tsx).
  const setoresForm = useMemo(
    () => buildSetoresObrigatorios(estoqueItens, estoqueShowroomAtual, setoresSaldosForm),
    [estoqueItens, estoqueShowroomAtual, setoresSaldosForm],
  )

  const handleMarcaCreated = useCallback(
    (marca: MarcaOption) => {
      setMarcas((prev) => [...prev, marca].sort((a, b) => a.nome.localeCompare(b.nome)))
      form.setValue('marca_id', marca.id, { shouldValidate: true, shouldDirty: true })
    },
    [form],
  )

  const handleFornecedorCreated = useCallback(
    (fornecedor: FornecedorOption) => {
      setFornecedores((prev) => [...prev, fornecedor].sort((a, b) => a.nome.localeCompare(b.nome)))
      form.setValue('fornecedor_principal_id', fornecedor.id, {
        shouldValidate: true,
        shouldDirty: true,
      })
    },
    [form],
  )

  const onSubmit = useCallback(
    async (v: FormData) => {
      setLoading(true)
      try {
        if (v.sku && (await checkSkuExists(v.sku, pecaId)))
          return form.setError('sku', { message: 'Em uso' })
        const payload = {
          ...v,
          sku: v.sku?.trim() === '' ? null : v.sku,
          fornecedor_principal_id:
            v.fornecedor_principal_id === 'none' ? null : v.fornecedor_principal_id,
        } as any
        if (pecaId) {
          await updateProduto(pecaId, payload)
          toast({ title: 'Sucesso', description: 'Peça salva!' })
        } else {
          const created = await createProduto(payload)
          toast({
            title: 'Sucesso',
            description: `Peça salva! Código gerado: ${(created as any).codigo_produto}`,
          })
        }
        onSuccess()
      } catch (e) {
        toast({ title: 'Erro', description: 'Falha ao salvar', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    },
    [pecaId, form, toast, onSuccess],
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
        {/* SPEC-174 N6b: coluna do "Estoque Integrado" (5ª parte, era 4ª) um
            pouco mais estreita, pra dar mais espaço ao formulário. */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-full min-h-0">
          <div className="lg:col-span-4 flex flex-col gap-2 overflow-y-auto pr-2 pb-2">
            <div className="space-y-1.5 border-2 border-slate-900 rounded-md p-2">
              <h3 className="text-sm font-semibold border-b-2 border-slate-900 pb-1">
                Dados Básicos
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-muted-foreground">Código *</label>
                  <Input
                    readOnly
                    disabled
                    className="h-7 text-sm bg-slate-100 text-slate-500"
                    value={codigoProdutoAtual ?? (pecaId ? '' : 'gerado automaticamente ao salvar')}
                  />
                </div>
                <InputField control={form.control} name="sku" label="Referência" />
              </div>
              <InputField control={form.control} name="nome" label="Nome *" />
              <div className="grid grid-cols-2 gap-2">
                <SelectField
                  control={form.control}
                  name="marca_id"
                  label="Marca *"
                  options={marcas}
                  extra={
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => setMarcaModalOpen(true)}
                      title="Cadastrar nova marca"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                />
                <SelectField
                  control={form.control}
                  name="categoria_id"
                  label="Categoria *"
                  options={categorias}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <SelectField
                  control={form.control}
                  name="fornecedor_principal_id"
                  label="Fornecedor"
                  options={[{ id: 'none', nome: 'Nenhum' }, ...fornecedores]}
                  extra={
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => setFornecedorModalOpen(true)}
                      title="Cadastrar novo fornecedor"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                />
                <InputField control={form.control} name="unidade" label="Unidade *" />
              </div>
              <InputField control={form.control} name="descricao_tecnica" label="Desc. Técnica" />
            </div>

            <div className="space-y-1.5 border-2 border-slate-900 rounded-md p-2">
              <h3 className="text-sm font-semibold border-b-2 border-slate-900 pb-1">
                Engenharia de Custos
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <InputField
                  control={form.control}
                  name="preco_custo"
                  label="Preço Custo (R$)"
                  type="number"
                />
                <InputField
                  control={form.control}
                  name="porc_frete"
                  label="% Frete"
                  type="number"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InputField control={form.control} name="porc_st" label="% ST" type="number" />
                <InputField control={form.control} name="ipi_entrada" label="% IPI" type="number" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InputField
                  control={form.control}
                  name="margem_lucro"
                  label="% Lucro"
                  type="number"
                />
                <InputField
                  control={form.control}
                  name="porc_despesas"
                  label="% Despesas"
                  type="number"
                />
              </div>
              <div className="bg-slate-50 p-1.5 rounded-md border space-y-1 mt-1">
                <div className="grid grid-cols-2 gap-2">
                  <InputField
                    control={form.control}
                    name="porc_bdi"
                    label="Valor BDI Calc. (R$)"
                    type="number"
                    readOnly
                  />
                  <InputField
                    control={form.control}
                    name="custo_total"
                    label="Custo Total Calc. (R$)"
                    type="number"
                    readOnly
                  />
                </div>
                <InputField
                  control={form.control}
                  name="preco_venda"
                  label="Preço Venda Final (R$)"
                  type="number"
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-1.5 border-2 border-slate-900 rounded-md p-2">
              <h3 className="text-sm font-semibold border-b-2 border-slate-900 pb-1">
                Dados Fiscais
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <InputField control={form.control} name="ncm" label="NCM" />
                <InputField control={form.control} name="tipo_fiscal" label="Tipo Fiscal" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InputField control={form.control} name="cst" label="CST" />
                <InputField control={form.control} name="cest" label="CEST" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InputField
                  control={form.control}
                  name="icms_entrada"
                  label="% ICMS Entr."
                  type="number"
                />
                <InputField
                  control={form.control}
                  name="mascara_produto"
                  label="Máscara / Família"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 items-end">
                <SelectField
                  control={form.control}
                  name="status_comercial"
                  label="Status Comercial"
                  options={[
                    { id: 'Normal', nome: 'Normal' },
                    { id: 'Lançamento', nome: 'Lançamento' },
                    { id: 'Fora de Linha', nome: 'Fora de Linha' },
                  ]}
                />
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between border p-1.5 rounded-md h-7">
                      <FormLabel className="text-xs">Ativo</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col h-full min-h-[250px] overflow-hidden border-2 border-slate-900 rounded-md p-2">
            <h3 className="text-sm font-semibold border-b-2 border-slate-900 pb-1 mb-1.5">
              Estoque Integrado
            </h3>
            {/* SPEC-174 N6c: lista vertical com os 8 setores obrigatórios
                (EstoqueSetoresList, igual ao painel da peça selecionada). Peça
                nova ainda não tem estoque. */}
            <div className="flex-1 overflow-auto">
              {pecaId ? (
                <EstoqueSetoresList setores={setoresForm} compact />
              ) : (
                <p className="text-center text-xs text-slate-500 py-4 border rounded-md bg-slate-50">
                  Salvar para ver estoque
                </p>
              )}
            </div>
            {/* SPEC-174 N6a: Excluir/Copiar/Salvar não cabiam numa linha só
                (justify-between) na largura desta coluna -- o Salvar ficava
                cortado pelo overflow-hidden do painel. Agora Excluir/Copiar
                ficam numa linha com quebra (flex-wrap) e Cancelar/Salvar
                sempre dividem a linha de baixo em duas metades (flex-1),
                cabendo inteiros mesmo com a coluna mais estreita (N6b). */}
            <div className="pt-2 flex flex-col gap-2 mt-auto">
              {/* SPEC-174 N7: Excluir/Copiar só aparecem com a ação "editar"
                  no Cadastro (hub_pode_executar); sem permissão, a peça
                  continua só em modo de consulta/leitura. */}
              {pecaId && canEdit && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Excluir Peça
                  </Button>
                  {onCopy && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-amber-700 border-amber-200 hover:bg-amber-50"
                      onClick={() => {
                        const nomeAtual = getValues('nome')
                        toast({
                          title: 'Dados copiados',
                          description: `Novo produto pré-preenchido com os dados de "${nomeAtual}". Ajuste o que for necessário (código, referência, campos alterados) e salve.`,
                        })
                        onCopy()
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1.5" />
                      Copiar
                    </Button>
                  )}
                </div>
              )}
              {/* flex-wrap + min-w: se a coluna ficar estreita demais, o Salvar
                  desce para a linha de baixo em vez de ser cortado. */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 min-w-[7rem]"
                  onClick={onSuccess}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 min-w-[7rem] bg-amber-600 hover:bg-amber-700"
                >
                  {loading ? 'Salvando...' : 'Salvar Peça'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta peça?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cadastro da peça será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Excluindo...' : 'Excluir Peça'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MarcaQuickCreateDialog
        open={marcaModalOpen}
        onOpenChange={setMarcaModalOpen}
        fornecedores={fornecedores}
        onCreated={handleMarcaCreated}
      />
      <FornecedorQuickCreateDialog
        open={fornecedorModalOpen}
        onOpenChange={setFornecedorModalOpen}
        onCreated={handleFornecedorCreated}
      />
    </Form>
  )
}
