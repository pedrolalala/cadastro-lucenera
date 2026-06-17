import { useCallback } from 'react'
import { CompactField } from './CompactField'
import { Button } from '@/components/ui/button'
import { Copy, MapPin } from 'lucide-react'
import { maskCEP } from '@/lib/utils'

export function AddressBlock({ form, prefix, title, onCopy, fetchAddress }: any) {
  const isPrincipal = prefix === ''
  const p = prefix ? `${prefix}_` : ''

  const handleCepChange = useCallback(
    async (e: any, val: string, onChange: any) => {
      if (val.replace(/\D/g, '').length === 8) {
        const data = await fetchAddress(val)
        if (data) {
          form.setValue(`${p}endereco`, data.logradouro || '', { shouldValidate: true })
          form.setValue(`${p}bairro`, data.bairro || '', { shouldValidate: true })
          form.setValue(`${p}cidade`, data.localidade || '', { shouldValidate: true })
          form.setValue(`${p}estado`, data.uf || '', { shouldValidate: true })
        }
      }
    },
    [fetchAddress, form, p],
  )

  return (
    <div className="bg-slate-100 p-4 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b pb-2">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-600" /> {title}
        </h4>
        {!isPrincipal && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCopy}
            className="h-6 text-xs px-2 text-slate-600"
          >
            <Copy className="w-3 h-3 mr-1" /> Copiar Principal
          </Button>
        )}
      </div>
      <div className="grid grid-cols-6 gap-2">
        <CompactField
          form={form}
          name={`${p}cep`}
          label="CEP"
          className="col-span-2"
          maskFn={maskCEP}
          onChangeExt={handleCepChange}
        />
        <CompactField form={form} name={`${p}endereco`} label="Logradouro" className="col-span-4" />
        <CompactField form={form} name={`${p}numero`} label="Número" className="col-span-2" />
        <CompactField form={form} name={`${p}bairro`} label="Bairro" className="col-span-4" />
        <CompactField form={form} name={`${p}cidade`} label="Cidade" className="col-span-4" />
        <CompactField form={form} name={`${p}estado`} label="UF" className="col-span-2" />
      </div>
    </div>
  )
}
