import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle } from 'lucide-react'

const schema = z.object({
  id: z.string().optional(),
  codigo: z.string().min(1, 'Código é obrigatório'),
  nome: z.string().min(2, 'Nome é obrigatório'),
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  arquiteto_id: z.string().optional().nullable(),
  responsavel_id: z.string().optional().nullable(),
  nivel_estrategico: z.enum(['1', '2', '3', '4']),
  status: z.string().min(1, 'Status é obrigatório'),
  data_entrada: z.string().min(10, 'Data inválida'),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  tipo_area: z.enum(['Residential', 'Corporativo', 'Exposição Comercial', 'Paisagismo']),
})

type FormData = z.infer<typeof schema>

export function ProjetoFormDialog({
  open,
  onOpenChange,
  projeto,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projeto: any
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const [clientes, setClientes] = useState<any[]>([])
  const [arquitetos, setArquitetos] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      setSuccess(false)
      supabase
        .from('contatos')
        .select('id, nome')
        .eq('tipo', 'cliente')
        .order('nome')
        .then(({ data }) => setClientes(data || []))
      supabase
        .from('contatos')
        .select('id, nome')
        .eq('tipo', 'arquiteto')
        .order('nome')
        .then(({ data }) => setArquitetos(data || []))
      supabase
        .from('usuarios')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome')
        .then(({ data }) => setUsuarios(data || []))
    }
  }, [open])

  const defaultValues = useMemo(() => {
    if (projeto) {
      return {
        id: projeto.id,
        codigo: projeto.codigo || '',
        nome: projeto.nome || '',
        cliente_id: projeto.cliente_id || '',
        arquiteto_id: projeto.arquiteto_id || '',
        responsavel_id: projeto.responsavel_id || '',
        nivel_estrategico: projeto.nivel_estrategico || '1',
        status: projeto.status || 'Estudo Inicial',
        data_entrada: projeto.data_entrada
          ? projeto.data_entrada.split('T')[0]
          : new Date().toISOString().split('T')[0],
        cidade: projeto.cidade || '',
        estado: projeto.estado || '',
        tipo_area: (projeto.area_do_projeto as any)?.tipo || 'Residential',
      }
    }
    return {
      codigo: '',
      nome: '',
      cliente_id: '',
      arquiteto_id: '',
      responsavel_id: '',
      nivel_estrategico: '1' as const,
      status: 'Estudo Inicial',
      data_entrada: new Date().toISOString().split('T')[0],
      cidade: '',
      estado: '',
      tipo_area: 'Residential' as const,
    }
  }, [projeto, open])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [defaultValues, form, open])

  const onSubmit = async (values: FormData) => {
    setLoading(true)

    const query = supabase.from('projetos').select('id').eq('codigo', values.codigo)
    if (values.id) query.neq('id', values.id)

    const { data: existing } = await query.maybeSingle()

    if (existing) {
      form.setError('codigo', { message: 'Este código já está em uso.' })
      setLoading(false)
      return
    }

    const payload = {
      codigo: values.codigo,
      nome: values.nome,
      cliente_id: values.cliente_id,
      arquiteto_id:
        values.arquiteto_id && values.arquiteto_id !== 'none' ? values.arquiteto_id : null,
      responsavel_id:
        values.responsavel_id && values.responsavel_id !== 'none' ? values.responsavel_id : null,
      nivel_estrategico: values.nivel_estrategico,
      status: values.status,
      data_entrada: values.data_entrada,
      cidade: values.cidade,
      estado: values.estado,
      area_do_projeto: { tipo: values.tipo_area },
    }

    let error
    if (values.id) {
      const { error: updateError } = await supabase
        .from('projetos')
        .update(payload)
        .eq('id', values.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('projetos')
        .insert({ ...payload, arquivado: false, historico: [] })
      error = insertError
    }

    setLoading(false)

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar projeto.', variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Projeto salvo com sucesso.' })
      onSuccess()
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tudo Certo!</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-fade-in-up" />
            <p className="text-lg font-medium text-slate-900 animate-fade-in">
              Projeto salvo com sucesso!
            </p>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Retornar à Listagem
            </Button>
            {!projeto && (
              <Button
                onClick={() => {
                  setSuccess(false)
                  form.reset()
                }}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Criar Outro Projeto
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{projeto ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="EX: PRJ-001" {...field} />
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
                    <FormLabel>Nome do Projeto</FormLabel>
                    <FormControl>
                      <Input placeholder="Residência Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cliente_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clientes.map((c) => (
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="arquiteto_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Arquiteto (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'none'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o arquiteto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {arquitetos.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.nome}
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
                name="responsavel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'none'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {usuarios.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.nome}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Estudo Inicial">Estudo Inicial</SelectItem>
                        <SelectItem value="Proposta Sinal">Proposta Sinal</SelectItem>
                        <SelectItem value="Elaboração Orçamento">Elaboração Orçamento</SelectItem>
                        <SelectItem value="Projeto executivo">Projeto executivo</SelectItem>
                        <SelectItem value="Finalizado">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nivel_estrategico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível Estratégico</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Nível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
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
                name="data_entrada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Entrada</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo_area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Área</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Residential">Residencial</SelectItem>
                        <SelectItem value="Corporativo">Corporativo</SelectItem>
                        <SelectItem value="Exposição Comercial">Exposição Comercial</SelectItem>
                        <SelectItem value="Paisagismo">Paisagismo</SelectItem>
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
                name="cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado (UF)</FormLabel>
                    <FormControl>
                      <Input placeholder="SP" maxLength={2} {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-6 border-t mt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-700 text-white min-w-[120px]"
              >
                {loading ? 'Salvando...' : 'Salvar Projeto'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
