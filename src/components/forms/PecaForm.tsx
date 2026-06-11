import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { useToast } from '@/hooks/use-toast'
import {
  getProduto,
  createProduto,
  updateProduto,
  checkCodigoExists,
  getFornecedores,
} from '@/services/produtos'
import { Check, Plus } from 'lucide-react'

const schema = z.object({
  codigo_produto: z.coerce.number().min(1, 'Código obrigatório'),
  nome: z.string().min(2, 'Nome obrigatório'),
  categoria: z.string().min(1, 'Categoria obrigatória'),
  descricao_tecnica: z.string().optional(),
  estoque_total: z.coerce.number().min(0, 'Estoque inválido').optional().default(0),
  preco_venda: z.coerce.number().min(0, 'Preço deve ser positivo').optional().default(0),
  fornecedor_principal_id: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

export function PecaForm({ pecaId, onSuccess }: { pecaId?: string | null; onSuccess: () => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [fornecedores, setFornecedores] = useState<
    { id: string; nome: string; razao_social: string | null }[]
  >([])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      codigo_produto: 0,
      nome: '',
      categoria: '',
      descricao_tecnica: '',
      estoque_total: 0,
      preco_venda: 0,
      fornecedor_principal_id: 'none',
    },
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const forn = await getFornecedores()
        setFornecedores(forn)

        if (pecaId) {
          const data = await getProduto(pecaId)
          form.reset({
            codigo_produto: data.codigo_produto || 0,
            nome: data.nome,
            categoria: data.categoria || '',
            descricao_tecnica: data.descricao_tecnica || '',
            estoque_total: data.estoque_total || 0,
            preco_venda: data.preco_venda || 0,
            fornecedor_principal_id: data.fornecedor_principal_id || 'none',
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
      const exists = await checkCodigoExists(values.codigo_produto, pecaId)
      if (exists) {
        form.setError('codigo_produto', { message: 'Este código já está em uso.' })
        setLoading(false)
        return
      }

      const payload = {
        codigo_produto: values.codigo_produto,
        nome: values.nome,
        categoria: values.categoria,
        descricao_tecnica: values.descricao_tecnica || null,
        estoque_total: values.estoque_total,
        preco_venda: values.preco_venda,
        fornecedor_principal_id:
          values.fornecedor_principal_id === 'none' ? null : values.fornecedor_principal_id || null,
      }

      if (pecaId) {
        await updateProduto(pecaId, payload)
      } else {
        await createProduto(payload)
      }

      setIsSuccess(true)
      toast({ title: 'Sucesso', description: pecaId ? 'Peça atualizada!' : 'Peça registrada!' })
    } catch (e: any) {
      toast({ title: 'Erro', description: 'Falha ao salvar peça.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    form.reset({
      codigo_produto: 0,
      nome: '',
      categoria: '',
      descricao_tecnica: '',
      estoque_total: 0,
      preco_venda: 0,
      fornecedor_principal_id: 'none',
    })
    setIsSuccess(false)
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
              onClick={handleReset}
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Fixadores" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fornecedor_principal_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor" />
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="estoque_total"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque Total</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
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
                <FormLabel>Preço de Venda (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
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
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
