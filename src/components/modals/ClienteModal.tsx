import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import useDataStore from '@/stores/use-data-store'
import { maskCPF, maskCNPJ, maskPhone } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Building2, Save, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { CompactField } from '../clientes/CompactField'
import { CompactSelect } from '../clientes/CompactSelect'
import { AddressBlock } from '../clientes/AddressBlock'

const clienteSchema = z.object({
  tipo_pessoa: z.enum(['Física', 'Jurídica']),
  ativo: z.enum(['true', 'false']).default('true'),
  nome: z.string().min(2, 'Obrigatório'),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  data_nascimento: z.string().optional(),
  cnpj: z.string().optional(),
  razao_social: z.string().optional(),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  limite_credito: z.string().optional(),
  regime_apuracao: z.string().optional(),
  vendedor_id: z.string().optional(),
  email: z.string().email('Inválido').optional().or(z.literal('')),
  email_financeiro: z.string().email('Inválido').optional().or(z.literal('')),
  email_alternativo: z.string().email('Inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  observacoes: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep_entrega: z.string().optional(),
  endereco_entrega: z.string().optional(),
  numero_entrega: z.string().optional(),
  bairro_entrega: z.string().optional(),
  cidade_entrega: z.string().optional(),
  estado_entrega: z.string().optional(),
  cep_cobranca: z.string().optional(),
  endereco_cobranca: z.string().optional(),
  numero_cobranca: z.string().optional(),
  bairro_cobranca: z.string().optional(),
  cidade_cobranca: z.string().optional(),
  estado_cobranca: z.string().optional(),
})

export function ClienteModal() {
  const { activeModal, closeModal, editingId, clientes, saveCliente } = useDataStore()
  const { toast } = useToast()
  const isOpen = activeModal === 'cliente'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vendedores, setVendedores] = useState<{ value: string; label: string }[]>([])

  const form = useForm<z.infer<typeof clienteSchema>>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { tipo_pessoa: 'Jurídica', ativo: 'true' },
  })
  const tp = form.watch('tipo_pessoa')

  useEffect(() => {
    supabase.rpc('get_vendedores').then(({ data }) => {
      if (data) setVendedores(data.map((u: any) => ({ value: u.id, label: u.name || u.email })))
    })
  }, [])

  useEffect(() => {
    if (isOpen) {
      if (editingId) {
        const c: any = clientes.find((cli) => cli.id === editingId)
        if (c) {
          form.reset({
            ...c,
            ativo: c.ativo ? 'true' : 'false',
            nome: c.nome || c.name || '',
            limite_credito: c.limite_credito ? String(c.limite_credito) : '',
          })
        }
      } else form.reset({ tipo_pessoa: 'Jurídica', ativo: 'true' })
    }
  }, [isOpen, editingId, clientes, form])

  const onSubmit = useCallback(
    async (data: any) => {
      setIsSubmitting(true)
      try {
        await saveCliente(
          {
            ...data,
            ativo: data.ativo === 'true',
            tipo: 'Cliente',
            name: data.nome,
            company: data.razao_social || '',
            phone: data.celular || data.telefone || '',
            status: data.ativo === 'true' ? 'Ativo' : 'Inativo',
            limite_credito: data.limite_credito ? parseFloat(data.limite_credito) : null,
          },
          editingId,
        )
        toast({ title: 'Sucesso', description: 'Cliente salvo!' })
        closeModal()
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message, variant: 'destructive' })
      } finally {
        setIsSubmitting(false)
      }
    },
    [saveCliente, editingId, toast, closeModal],
  )

  const fetchAddress = useCallback(async (cep: string) => {
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`)
      return await res.json()
    } catch {
      return null
    }
  }, [])

  const copyAddr = useCallback(
    (to: 'entrega' | 'cobranca') => {
      const fields = ['cep', 'endereco', 'numero', 'bairro', 'cidade', 'estado']
      fields.forEach((f) =>
        form.setValue(
          `${to === 'entrega' ? 'cep_entrega' : 'cep_cobranca'}`.replace('cep', f) as any,
          form.getValues(f as any) || '',
          { shouldValidate: true, shouldDirty: true },
        ),
      )
    },
    [form],
  )

  const copyToEntrega = useCallback(() => copyAddr('entrega'), [copyAddr])
  const copyToCobranca = useCallback(() => copyAddr('cobranca'), [copyAddr])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-[98vw] h-[98vh] flex flex-col p-0 gap-0 bg-slate-50 overflow-hidden">
        <DialogHeader className="p-4 border-b bg-white flex-row items-center justify-between shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />{' '}
            {editingId ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={closeModal}>
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
            <Button
              size="sm"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Save className="w-4 h-4 mr-1" /> Salvar
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <ScrollArea className="flex-1 p-4 sm:p-6">
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="bg-white p-5 rounded-lg border shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">
                  Dados Fiscais e Cadastrais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <CompactSelect
                    form={form}
                    name="tipo_pessoa"
                    label="Tipo Pessoa"
                    options={[
                      { label: 'Pessoa Física', value: 'Física' },
                      { label: 'Pessoa Jurídica', value: 'Jurídica' },
                    ]}
                  />
                  <CompactSelect
                    form={form}
                    name="ativo"
                    label="Status"
                    options={[
                      { label: 'Ativo', value: 'true' },
                      { label: 'Inativo', value: 'false' },
                    ]}
                  />
                  <CompactField
                    form={form}
                    name="nome"
                    label={tp === 'Jurídica' ? 'Nome Fantasia' : 'Nome Completo'}
                    className="lg:col-span-2"
                  />

                  {tp === 'Física' ? (
                    <>
                      <CompactField form={form} name="cpf" label="CPF" maskFn={maskCPF} />
                      <CompactField form={form} name="rg" label="RG" />
                      <CompactField
                        form={form}
                        name="data_nascimento"
                        label="Data de Nascimento"
                        type="date"
                      />
                    </>
                  ) : (
                    <>
                      <CompactField
                        form={form}
                        name="razao_social"
                        label="Razão Social"
                        className="lg:col-span-2"
                      />
                      <CompactField form={form} name="cnpj" label="CNPJ" maskFn={maskCNPJ} />
                      <CompactField
                        form={form}
                        name="inscricao_estadual"
                        label="Inscrição Estadual"
                      />
                      <CompactField
                        form={form}
                        name="inscricao_municipal"
                        label="Inscrição Municipal"
                      />
                    </>
                  )}

                  <CompactField
                    form={form}
                    name="limite_credito"
                    label="Limite de Crédito (R$)"
                    type="number"
                  />
                  <CompactSelect
                    form={form}
                    name="regime_apuracao"
                    label="Regime de Apuração"
                    options={[
                      { label: 'Simples Nacional', value: 'Simples Nacional' },
                      { label: 'Lucro Presumido', value: 'Lucro Presumido' },
                      { label: 'Lucro Real', value: 'Lucro Real' },
                    ]}
                  />
                  <CompactSelect
                    form={form}
                    name="vendedor_id"
                    label="Vendedor Padrão"
                    options={vendedores}
                  />
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">
                  Comunicação e Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <CompactField form={form} name="email" label="E-mail Principal" type="email" />
                  <CompactField
                    form={form}
                    name="email_financeiro"
                    label="E-mail Financeiro"
                    type="email"
                  />
                  <CompactField
                    form={form}
                    name="email_alternativo"
                    label="E-mail Alternativo"
                    type="email"
                  />
                  <CompactField
                    form={form}
                    name="telefone"
                    label="Telefone Fixo"
                    maskFn={maskPhone}
                  />
                  <CompactField form={form} name="celular" label="Celular" maskFn={maskPhone} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 ml-1">Sistema de Endereços</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <AddressBlock
                    form={form}
                    prefix=""
                    title="Endereço Principal"
                    fetchAddress={fetchAddress}
                  />
                  <AddressBlock
                    form={form}
                    prefix="entrega"
                    title="Endereço de Entrega"
                    onCopy={copyToEntrega}
                    fetchAddress={fetchAddress}
                  />
                  <AddressBlock
                    form={form}
                    prefix="cobranca"
                    title="Endereço de Cobrança"
                    onCopy={copyToCobranca}
                    fetchAddress={fetchAddress}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
