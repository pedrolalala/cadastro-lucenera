import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  getProduto,
  createProduto,
  updateProduto,
  checkSkuExists,
  getFornecedores,
  getMarcas,
  getCategoriasProduto,
  getEstoqueItens,
  getNextSku,
  createMarca,
  createFornecedor,
} from '@/services/produtos'

const SKU_PREFIX = 'teste'

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
      <FormItem className="space-y-1">
        <FormLabel className="text-xs">{label}</FormLabel>
        <FormControl>
          <Input
            type={type}
            readOnly={readOnly}
            step={type === 'number' ? '0.01' : undefined}
            className="h-8 text-sm"
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
    render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className="text-xs">{label}</FormLabel>
        <div className="flex items-center gap-1">
          <div className="flex-1 min-w-0">
            <Select
              onValueChange={field.onChange}
              value={field.value ? String(field.value) : undefined}
            >
              <FormControl>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecione..." />
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
    )}
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

export function PecaForm({ pecaId, onSuccess }: { pecaId?: string | null; onSuccess: () => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([])
  const [marcas, setMarcas] = useState<MarcaOption[]>([])
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([])
  const [estoqueItens, setEstoqueItens] = useState<any[]>([])
  // SPEC-053: codigo_produto não é mais editável nem parte do form — é
  // gerado pelo DEFAULT nextval(produtos_codigo_produto_seq) da coluna.
  // Aqui só guardamos o valor para exibição (existente ao editar).
  const [codigoProdutoAtual, setCodigoProdutoAtual] = useState<number | null>(null)
  const [marcaModalOpen, setMarcaModalOpen] = useState(false)
  const [fornecedorModalOpen, setFornecedorModalOpen] = useState(false)

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
      Promise.all([getProduto(pecaId), getEstoqueItens(pecaId)]).then(([data, estq]) => {
        setEstoqueItens(estq || [])
        setCodigoProdutoAtual((data as any).codigo_produto ?? null)
        form.reset({
          ...data,
          fornecedor_principal_id: data.fornecedor_principal_id || 'none',
          ativo: data.ativo ?? true,
          porc_frete: (data as any).porc_frete || 0,
          porc_bdi: (data as any).porc_bdi || 0,
          porc_st: (data as any).porc_st || 0,
          valor_venda: (data as any).valor_venda || (data as any).preco_venda || 0,
          cst: (data as any).cst || '',
          cest: (data as any).cest || '',
          mascara_produto: (data as any).mascara_produto || '',
          status_comercial: (data as any).status_comercial || 'Normal',
        } as FormData)
      })
    } else {
      setCodigoProdutoAtual(null)
      getNextSku(SKU_PREFIX)
        .then((nextSku) => {
          if (!form.getValues('sku')) {
            form.setValue('sku', nextSku, { shouldValidate: true })
          }
        })
        .catch(console.error)
    }
  }, [pecaId, form])

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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-0">
          <div className="space-y-3 overflow-y-auto pr-2 pb-2 border-2 border-amber-200 rounded-md p-3">
            <h3 className="text-sm font-semibold border-b-2 border-amber-300 pb-1">
              Dados Básicos
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Código *</label>
                <Input
                  readOnly
                  disabled
                  className="h-8 text-sm bg-slate-100 text-slate-500"
                  value={codigoProdutoAtual ?? (pecaId ? '' : 'gerado automaticamente ao salvar')}
                />
              </div>
              <InputField control={form.control} name="sku" label="Código Progressivo (SKU)" />
            </div>
            <InputField control={form.control} name="nome" label="Nome *" />
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
                  className="h-8 w-8 shrink-0"
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
                  className="h-8 w-8 shrink-0"
                  onClick={() => setFornecedorModalOpen(true)}
                  title="Cadastrar novo fornecedor"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <InputField control={form.control} name="unidade" label="Unidade *" />
              <InputField control={form.control} name="referencia" label="Referência" />
            </div>
            <InputField control={form.control} name="descricao_tecnica" label="Desc. Técnica" />
          </div>

          <div className="space-y-3 overflow-y-auto pr-2 pb-2 border-2 border-sky-200 rounded-md p-3">
            <h3 className="text-sm font-semibold border-b-2 border-sky-300 pb-1">
              Engenharia de Custos
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <InputField
                control={form.control}
                name="preco_custo"
                label="Preço Custo (R$)"
                type="number"
              />
              <InputField control={form.control} name="porc_frete" label="% Frete" type="number" />
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
            <div className="bg-slate-50 p-3 rounded-md border space-y-2 mt-2">
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

          <div className="space-y-3 overflow-y-auto pr-2 pb-2 border-2 border-violet-200 rounded-md p-3">
            <h3 className="text-sm font-semibold border-b-2 border-violet-300 pb-1">
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
            </div>
            <InputField control={form.control} name="mascara_produto" label="Máscara / Família" />
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
                <FormItem className="flex items-center justify-between border p-2 rounded-md h-12">
                  <FormLabel className="text-xs mt-1">Ativo no Catálogo</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col h-full min-h-[250px] overflow-hidden border-2 border-emerald-200 rounded-md p-3">
            <h3 className="text-sm font-semibold border-b-2 border-emerald-300 pb-1 mb-3">
              Estoque Integrado
            </h3>
            <div className="border rounded-md flex-1 overflow-auto bg-slate-50">
              <Table>
                <TableHeader className="bg-slate-100 sticky top-0">
                  <TableRow>
                    <TableHead className="h-8 py-1 px-2 text-xs">Setor</TableHead>
                    <TableHead className="h-8 py-1 px-2 text-xs text-right">Atual</TableHead>
                    <TableHead className="h-8 py-1 px-2 text-xs text-right">Reserv.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estoqueItens.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-xs text-slate-500 py-4">
                        Salvar para ver estoque
                      </TableCell>
                    </TableRow>
                  ) : (
                    estoqueItens.map((i) => (
                      <TableRow key={i.id} className="h-8">
                        <TableCell className="py-1 px-2 text-xs font-medium">{i.local}</TableCell>
                        <TableCell className="py-1 px-2 text-xs text-right">
                          {i.quantidade}
                        </TableCell>
                        <TableCell className="py-1 px-2 text-xs text-right text-slate-500">
                          {i.quantidade_reservada || 0}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="pt-4 flex justify-end gap-2 mt-auto">
              <Button type="button" variant="outline" onClick={onSuccess}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700">
                {loading ? 'Salvando...' : 'Salvar Peça'}
              </Button>
            </div>
          </div>
        </div>
      </form>

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
