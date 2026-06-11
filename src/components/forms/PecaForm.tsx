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
import { useStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

const schema = z.object({
  sku: z.string().min(2, 'SKU obrigatório'),
  name: z.string().min(2, 'Nome obrigatório'),
  spec: z.string().optional().default(''),
  stock: z.coerce.number().min(0, 'Estoque inválido'),
  imageUrl: z.string().url('URL inválida').or(z.literal('')),
})

export function PecaForm({ onSuccess }: { onSuccess: () => void }) {
  const { addPeca } = useStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { sku: '', name: '', spec: '', stock: 0, imageUrl: '' },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    setLoading(true)
    try {
      const finalValues = {
        ...values,
        imageUrl:
          values.imageUrl ||
          `https://img.usecurling.com/p/200/200?q=${encodeURIComponent(values.name)}`,
      }
      await addPeca(finalValues)
      toast({ title: 'Sucesso', description: 'Peça cadastrada com sucesso!' })
      onSuccess()
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao cadastrar peça', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU / Código</FormLabel>
                <FormControl>
                  <Input placeholder="PC-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Qtd. Estoque</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Peça</FormLabel>
              <FormControl>
                <Input placeholder="Engrenagem 40D" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="spec"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Especificações (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Aço carbono..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-2">
          <Button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Peça'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
