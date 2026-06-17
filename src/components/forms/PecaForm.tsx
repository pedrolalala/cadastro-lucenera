import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
  checkCodigoExists,
  checkSkuExists,
  getFornecedores,
  getMarcas,
  getCategoriasProduto,
  getEstoqueItens,
} from '@/services/produtos'

const schema = z.object({
  codigo_produto: z.coerce.number().min(1, 'Obrigatório'),
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

const SelectField = ({ control, name, label, options }: any) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className="space-y-1">
        <FormLabel className="text-xs">{label}</FormLabel>
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
              <SelectItem key={o.id || o.value || o.nome} value={String(o.id || o.value || o.nome)}>
                {o.nome || o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage className="text-[10px]" />
      </FormItem>
    )}
  />
)

export function PecaForm({ pecaId, onSuccess }: { pecaId?: string | null; onSuccess: () => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fornecedores, setFornecedores] = useState<
    { id: string; nome: string; razao_social: string | null }[]
  >([])
  const [marcas, setMarcas] = useState<{ id: string; nome: string }[]>([])
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([])
  const [estoqueItens, setEstoqueItens] = useState<any[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      codigo_produto: 0,
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
    }
  }, [pecaId, form])

  const onSubmit = useCallback(
    async (v: FormData) => {
      setLoading(true)
      try {
        if (await checkCodigoExists(v.codigo_produto, pecaId))
          return form.setError('codigo_produto', { message: 'Em uso' })
        if (v.sku && (await checkSkuExists(v.sku, pecaId)))
          return form.setError('sku', { message: 'Em uso' })
        const payload = {
          ...v,
          fornecedor_principal_id:
            v.fornecedor_principal_id === 'none' ? null : v.fornecedor_principal_id,
        } as any
        if (pecaId) await updateProduto(pecaId, payload)
        else await createProduto(payload)
        toast({ title: 'Sucesso', description: 'Peça salva!' })
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
          <div className="space-y-3 overflow-y-auto pr-2 pb-2">
            <h3 className="text-sm font-semibold border-b pb-1">Dados Básicos</h3>
            <div className="grid grid-cols-2 gap-2">
              <InputField
                control={form.control}
                name="codigo_produto"
                label="Código *"
                type="number"
              />
              <InputField control={form.control} name="sku" label="SKU" />
            </div>
            <InputField control={form.control} name="nome" label="Nome *" />
            <SelectField control={form.control} name="marca_id" label="Marca *" options={marcas} />
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
            />
            <div className="grid grid-cols-2 gap-2">
              <InputField control={form.control} name="unidade" label="Unidade *" />
              <InputField control={form.control} name="referencia" label="Referência" />
            </div>
            <InputField control={form.control} name="descricao_tecnica" label="Desc. Técnica" />
          </div>

          <div className="space-y-3 overflow-y-auto pr-2 pb-2">
            <h3 className="text-sm font-semibold border-b pb-1">Engenharia de Custos</h3>
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

          <div className="space-y-3 overflow-y-auto pr-2 pb-2">
            <h3 className="text-sm font-semibold border-b pb-1">Dados Fiscais</h3>
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

          <div className="flex flex-col h-full min-h-[250px] overflow-hidden">
            <h3 className="text-sm font-semibold border-b pb-1 mb-3">Estoque Integrado</h3>
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
    </Form>
  )
}
