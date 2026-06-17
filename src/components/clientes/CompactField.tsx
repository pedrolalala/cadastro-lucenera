import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function CompactField({
  form,
  name,
  label,
  placeholder,
  maskFn,
  type = 'text',
  className,
  onChangeExt,
}: any) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('space-y-1', className)}>
          <FormLabel className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            {label}
          </FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              className="h-8 text-sm bg-white"
              {...field}
              value={field.value || ''}
              onChange={(e) => {
                const val = maskFn ? maskFn(e.target.value) : e.target.value
                field.onChange(val)
                if (onChangeExt) onChangeExt(e, val, field.onChange)
              }}
            />
          </FormControl>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )}
    />
  )
}
