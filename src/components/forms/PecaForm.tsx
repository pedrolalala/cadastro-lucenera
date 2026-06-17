import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Check, Plus, PackageOpen, Calculator, FileText, Box } from 'lucide-react'

const schema = z.object({
  codigo_produto: z.coerce.number().min(1, 'Código obrigatório'),
  sku: z.string().optional(),
  nome: z.string().min(2, 'Nome obrigatório'),
  marca_id: z.string().min(1, 'Marca obrigatória'),
  categoria_id: z.string().min(1, 'Categoria obrigatória'),
  fornecedor_principal_id: z.string().optional().or(z.literal('none')).or(z.literal('')),
  unidade: z.string().min(1, 'Unidade obrigatória').default('UN'),
  referencia: z.string().optional(),
  descricao_tecnica: z.string().optional(),
  preco_custo: z.coerce.number().min(0, 'Preço de custo inválido'),
  preco_venda: z.coerce.number().min(0, 'Preço de venda inválido'),
  estoque_total: z.coerce.number().min(0).optional().default(0),
  ncm: z.string().max(10).optional(),
  tipo_fiscal: z.string().optional(),
  ativo: z.boolean().default(true),
  porc_frete: z.coerce.number().min(0).optional().default(0),
  porc_despesas: z.coerce.number().min(0).optional().default(0),
  porc_bdi: z.coerce.number().min(0).optional().default(0),
  margem_lucro: z.coerce.number().min(0).optional().default(0),
  custo_total: z.coerce.number().min(0).optional().default(0),
  cst: z.string().optional().default(''),
  cest: z.string().optional().default(''),
  icms_entrada: z.coerce.number().min(0).optional().default(0),
  ipi_entrada: z.coerce.number().min(0).optional().default(0),
  mascara_produto: z.string().optional().default(''),
  status_comercial: z.string().optional().default('Normal'),
})

type FormData = z.infer<typeof schema>

export function PecaForm({ pecaId, onSuccess }: { pecaId?: string | null; onSuccess: () => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
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
      estoque_total: 0,
      ncm: '',
      tipo_fiscal: '',
      ativo: true,
      porc_frete: 0,
      porc_despesas: 0,
      porc_bdi: 0,
      margem_lucro: 0,
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
  const preco_custo = watch('preco_custo') || 0
  const porc_frete = watch('porc_frete') || 0
  const porc_despesas = watch('porc_despesas') || 0
  const porc_bdi = watch('porc_bdi') || 0
  const margem_lucro = watch('margem_lucro') || 0

  useEffect(() => {
    const custo = preco_custo * (1 + porc_frete / 100 + porc_despesas / 100 + porc_bdi / 100)
    const venda = custo * (1 + margem_lucro / 100)
    if (getValues('custo_total') !== Number(custo.toFixed(2)))
      setValue('custo_total', Number(custo.toFixed(2)))
    if (getValues('preco_venda') !== Number(venda.toFixed(2)))
      setValue('preco_venda', Number(venda.toFixed(2)))
  }, [preco_custo, porc_frete, porc_despesas, porc_bdi, margem_lucro, setValue, getValues])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [forn, mrc, cats] = await Promise.all([
          getFornecedores(),
          getMarcas(),
          getCategoriasProduto(),
        ])
        setFornecedores(forn)
        setMarcas(mrc)
        setCategorias(cats)
        if (pecaId) {
          const [data, estoque] = await Promise.all([getProduto(pecaId), getEstoqueItens(pecaId)])
          setEstoqueItens(estoque || [])
          form.reset({
            codigo_produto: data.codigo_produto || 0,
            sku: data.sku || '',
            nome: data.nome || '',
            marca_id: data.marca_id || '',
            categoria_id: data.categoria_id || '',
            fornecedor_principal_id: data.fornecedor_principal_id || 'none',
            unidade: data.unidade || 'UN',
            referencia: data.referencia || '',
            descricao_tecnica: data.descricao_tecnica || '',
            preco_custo: data.preco_custo || 0,
            preco_venda: data.preco_venda || 0,
            estoque_total: data.estoque_total || 0,
            ncm: data.ncm || '',
            tipo_fiscal: data.tipo_fiscal || '',
            ativo: data.ativo ?? true,
            porc_frete: (data as any).porc_frete || 0,
            porc_despesas: data.porc_despesas || 0,
            porc_bdi: (data as any).porc_bdi || 0,
            margem_lucro: data.margem_lucro || 0,
            custo_total: data.custo_total || 0,
            cst: (data as any).cst || '',
            cest: (data as any).cest || '',
            icms_entrada: data.icms_entrada || 0,
            ipi_entrada: data.ipi_entrada || 0,
            mascara_produto: (data as any).mascara_produto || '',
            status_comercial: (data as any).status_comercial || 'Normal',
          })
        }
      } catch (e) {
        toast({ title: 'Erro', description: 'Erro ao carregar dados', variant: 'destructive' })
      }
    }
    loadData()
  }, [pecaId, form, toast])

  async function onSubmit(values: FormData) {
    setLoading(true)
    try {
      if (await checkCodigoExists(values.codigo_produto, pecaId))
        return form.setError('codigo_produto', { message: 'Este código já está em uso.' })
      if (values.sku && (await checkSkuExists(values.sku, pecaId)))
        return form.setError('sku', { message: 'Este SKU já está em uso.' })

      const payload = {
        codigo_produto: values.codigo_produto,
        sku: values.sku || null,
        nome: values.nome,
        marca_id: values.marca_id,
        categoria_id: values.categoria_id,
        fornecedor_principal_id:
          values.fornecedor_principal_id === 'none' ? null : values.fornecedor_principal_id || null,
        unidade: values.unidade,
        referencia: values.referencia || null,
        descricao_tecnica: values.descricao_tecnica || null,
        preco_custo: values.preco_custo,
        preco_venda: values.preco_venda,
        estoque_total: values.estoque_total,
        ncm: values.ncm || null,
        tipo_fiscal: values.tipo_fiscal || null,
        ativo: values.ativo,
        porc_frete: values.porc_frete,
        porc_despesas: values.porc_despesas,
        porc_bdi: values.porc_bdi,
        margem_lucro: values.margem_lucro,
        custo_total: values.custo_total,
        cst: values.cst || null,
        cest: values.cest || null,
        icms_entrada: values.icms_entrada,
        ipi_entrada: values.ipi_entrada,
        mascara_produto: values.mascara_produto || null,
        status_comercial: values.status_comercial,
      } as any

      pecaId ? await updateProduto(pecaId, payload) : await createProduto(payload)
      setIsSuccess(true)
      toast({ title: 'Sucesso', description: pecaId ? 'Peça atualizada!' : 'Peça registrada!' })
    } catch (e: any) {
      toast({ title: 'Erro', description: 'Falha ao salvar peça.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-fade-in-up">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
          <Check className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Peça salva com sucesso!</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          A peça foi registrada no sistema e já está disponível na listagem do inventário.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-6 w-full max-w-sm">
          <Button variant="outline" className="w-full" onClick={onSuccess}>
            Voltar para listagem
          </Button>
          {!pecaId && (
            <Button
              onClick={() => {
                form.reset()
                setIsSuccess(false)
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar nova peça
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
        <section className="space-y-4">
          <div className="flex items-center pb-2 border-b border-slate-200">
            <PackageOpen className="w-5 h-5 mr-2 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-900">Informações Principais</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="codigo_produto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código da Peça *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 1001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: PRF-SXT-1001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Peça *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Parafuso Sextavado" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="marca_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {marcas.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoria_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fornecedor_principal_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor Principal</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum fornecedor</SelectItem>
                      {fornecedores.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nome} {f.razao_social ? `(${f.razao_social})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade de Medida *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: UN, PC, KG" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="referencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referência</FormLabel>
                  <FormControl>
                    <Input placeholder="Cód. do fabricante" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4 shadow-sm h-[68px]">
                  <div className="space-y-0.5">
                    <FormLabel>Status da Peça</FormLabel>
                    <div className="text-[0.8rem] text-slate-500">
                      Ativar ou inativar no catálogo
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="descricao_tecnica"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição Técnica</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Detalhes de material, peso, dimensões..."
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center pb-2 border-b border-slate-200">
            <Calculator className="w-5 h-5 mr-2 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-900">Engenharia de Custos</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/80 p-4 rounded-lg border border-slate-100">
            <FormField
              control={form.control}
              name="preco_custo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço Custo (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="porc_frete"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>% Frete</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="porc_despesas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>% Despesas</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="porc_bdi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>% BDI</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
            <FormField
              control={form.control}
              name="custo_total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-emerald-800">Custo Total (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      readOnly
                      className="bg-emerald-50 font-semibold"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="margem_lucro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-emerald-800">% Margem Lucro</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preco_venda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-emerald-800">Preço Venda (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      readOnly
                      className="bg-emerald-50 font-semibold text-emerald-700"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center pb-2 border-b border-slate-200">
            <FileText className="w-5 h-5 mr-2 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-900">Fiscais e Técnicas</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="ncm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NCM</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 8418.10.90" maxLength={10} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cst"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CST</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 00, 20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cest"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEST</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 01.001.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipo_fiscal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo Fiscal</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 00, 09" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="icms_entrada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>% ICMS Entrada</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ipi_entrada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>% IPI Entrada</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mascara_produto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máscara / Família</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Eletrodomésticos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status_comercial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Comercial</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Lançamento">Lançamento</SelectItem>
                      <SelectItem value="Fora de Linha">Fora de Linha</SelectItem>
                      <SelectItem value="Promoção">Promoção</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center pb-2 border-b border-slate-200">
            <Box className="w-5 h-5 mr-2 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-900">Estoque (Por Local)</h3>
          </div>
          {pecaId ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Local</TableHead>
                    <TableHead className="text-right">Qtd Atual</TableHead>
                    <TableHead className="text-right">Qtd Reserva</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estoqueItens.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-slate-500 h-16">
                        Nenhum registro de estoque.
                      </TableCell>
                    </TableRow>
                  ) : (
                    estoqueItens
                      .filter((i) => i.local !== 'Reservado')
                      .map((item) => {
                        const reservas =
                          estoqueItens.find((i) => i.local === 'Reservado')?.quantidade || 0
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium text-slate-700">
                              {item.local}
                            </TableCell>
                            <TableCell className="text-right">{item.quantidade}</TableCell>
                            <TableCell className="text-right text-slate-400">
                              {item.local === 'Estoque' ? reservas : 0}
                            </TableCell>
                          </TableRow>
                        )
                      })
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-500 text-sm">
              Salve a peça para gerenciar o estoque.
            </div>
          )}
        </section>

        <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-amber-600 hover:bg-amber-700 text-white sm:min-w-[120px]"
            disabled={loading}
          >
            {loading ? 'Salvando...' : pecaId ? 'Atualizar Peça' : 'Registrar Peça'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
