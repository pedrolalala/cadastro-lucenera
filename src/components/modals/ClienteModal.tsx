import { useEffect, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import useDataStore from '@/stores/use-data-store'
import { maskCPF, maskCNPJ, maskPhone, maskCEP } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const clienteSchema = z
  .object({
    tipo_pessoa: z.enum(['Física', 'Jurídica']),
    nome: z.string().min(2, 'Nome é obrigatório'),
    cpf: z.string().optional(),
    rg: z.string().optional(),
    data_nascimento: z.string().optional(),
    cnpj: z.string().optional(),
    razao_social: z.string().optional(),
    nome_empresa: z.string().optional(),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    email_financeiro: z.string().email('E-mail inválido').optional().or(z.literal('')),
    telefone: z.string().optional(),
    celular: z.string().optional(),
    endereco: z.string().optional(),
    bairro: z.string().optional(),
    cep: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    observacoes: z.string().optional(),
    ativo: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.tipo_pessoa === 'Física') {
      if (!data.cpf || data.cpf.replace(/\D/g, '').length !== 11) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CPF inválido', path: ['cpf'] })
      }
    } else {
      if (!data.cnpj || data.cnpj.replace(/\D/g, '').length !== 14) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CNPJ inválido', path: ['cnpj'] })
      }
      if (!data.razao_social || data.razao_social.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Razão social é obrigatória',
          path: ['razao_social'],
        })
      }
    }
  })

type FormValues = z.infer<typeof clienteSchema>

export function ClienteModal() {
  const { activeModal, closeModal, editingId, clientes, saveCliente } = useDataStore()
  const { toast } = useToast()
  const isOpen = activeModal === 'cliente'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [continueAdding, setContinueAdding] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipo_pessoa: 'Jurídica',
      nome: '',
      ativo: true,
      cpf: '',
      rg: '',
      data_nascimento: '',
      cnpj: '',
      razao_social: '',
      nome_empresa: '',
      email: '',
      email_financeiro: '',
      telefone: '',
      celular: '',
      endereco: '',
      bairro: '',
      cep: '',
      cidade: '',
      estado: '',
      observacoes: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (editingId) {
        const c = clientes.find((cli) => cli.id === editingId)
        if (c) {
          form.reset({
            tipo_pessoa: c.tipo_pessoa || 'Jurídica',
            nome: c.nome || c.name || '',
            cpf: c.cpf || '',
            rg: c.rg || '',
            data_nascimento: c.data_nascimento || '',
            cnpj: c.cnpj || '',
            razao_social: c.razao_social || '',
            nome_empresa: c.nome_empresa || c.company || '',
            email: c.email || '',
            email_financeiro: c.email_financeiro || '',
            telefone: c.telefone || c.phone || '',
            celular: c.celular || '',
            endereco: c.endereco || '',
            bairro: c.bairro || '',
            cep: c.cep || '',
            cidade: c.cidade || '',
            estado: c.estado || '',
            observacoes: c.observacoes || '',
            ativo: c.ativo ?? c.status === 'Ativo',
          })
        }
      } else {
        form.reset({
          tipo_pessoa: 'Jurídica',
          nome: '',
          ativo: true,
          cpf: '',
          rg: '',
          data_nascimento: '',
          cnpj: '',
          razao_social: '',
          nome_empresa: '',
          email: '',
          email_financeiro: '',
          telefone: '',
          celular: '',
          endereco: '',
          bairro: '',
          cep: '',
          cidade: '',
          estado: '',
          observacoes: '',
        })
      }
    }
  }, [isOpen, editingId, clientes, form])

  const tipoPessoa = form.watch('tipo_pessoa')

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      await saveCliente(
        {
          ...data,
          tipo: 'Cliente',
          name: data.nome,
          company: data.nome_empresa || data.razao_social || '',
          phone: data.celular || data.telefone || '',
          status: data.ativo ? 'Ativo' : 'Inativo',
        },
        editingId,
      )
      toast({
        title: 'Sucesso',
        description: editingId ? 'Cliente atualizado!' : 'Cliente cadastrado com sucesso!',
      })
      if (!editingId && continueAdding) {
        form.reset()
      } else {
        closeModal()
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipo_pessoa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Pessoa</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Física">Pessoa Física</SelectItem>
                            <SelectItem value="Jurídica">Pessoa Jurídica</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ativo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(v === 'true')}
                          defaultValue={field.value ? 'true' : 'false'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Ativo</SelectItem>
                            <SelectItem value="false">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">
                    Dados Principais
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>
                            Nome {tipoPessoa === 'Jurídica' && 'Fantasia / Contato'}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Nome principal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {tipoPessoa === 'Física' ? (
                      <>
                        <FormField
                          control={form.control}
                          name="cpf"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="000.000.000-00"
                                  {...field}
                                  onChange={(e) => field.onChange(maskCPF(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="rg"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>RG</FormLabel>
                              <FormControl>
                                <Input placeholder="00.000.000-0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="data_nascimento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Nascimento</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : (
                      <>
                        <FormField
                          control={form.control}
                          name="cnpj"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CNPJ</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="00.000.000/0000-00"
                                  {...field}
                                  onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="razao_social"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Razão Social</FormLabel>
                              <FormControl>
                                <Input placeholder="Empresa Ltda" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Contato</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input placeholder="email@exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email_financeiro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail Financeiro</FormLabel>
                          <FormControl>
                            <Input placeholder="financeiro@exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone Fixo</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(00) 0000-0000"
                              {...field}
                              onChange={(e) => field.onChange(maskPhone(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="celular"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Celular</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(00) 00000-0000"
                              {...field}
                              onChange={(e) => field.onChange(maskPhone(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Endereço</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                    <FormField
                      control={form.control}
                      name="cep"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00000-000"
                              {...field}
                              onChange={(e) => field.onChange(maskCEP(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endereco"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-4">
                          <FormLabel>Logradouro</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua, Avenida..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bairro"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input placeholder="Bairro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-3">
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="estado"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-1">
                          <FormLabel>UF</FormLabel>
                          <FormControl>
                            <Input placeholder="SP" maxLength={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Notas adicionais sobre o cliente..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 border-t bg-slate-50 flex items-center justify-between sm:justify-between">
              {!editingId ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="continue"
                    checked={continueAdding}
                    onChange={(e) => setContinueAdding(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-600"
                  />
                  <label htmlFor="continue" className="text-sm text-slate-600 cursor-pointer">
                    Cadastrar outro após salvar
                  </label>
                </div>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
