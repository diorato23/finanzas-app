"use client"

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { editTransaccion } from "./actions"
import { toast } from "sonner"
import { EditIcon, SparklesIcon } from "lucide-react"
import { getCategoryWithEmoji } from "@/lib/utils"
import { suggestCategory } from "@/app/actions/ai-categorize"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formatToCurrencyInput = (value: string | number) => {
    const stringVal = String(value)
    const cleaned = stringVal.replace(/\D/g, "")
    if (!cleaned) return ""
    const number = parseInt(cleaned, 10)
    return new Intl.NumberFormat('es-CO').format(number)
}

const unformatCurrency = (formatted: string) => {
    return formatted.replace(/\D/g, "")
}

const formSchema = z.object({
  id: z.string(),
  tipo: z.enum(["pago", "cobro"]),
  montoVisual: z.string().min(1, "Campo requerido"),
  descripcion: z.string().min(1, "Campo requerido"),
  categoria: z.string().min(1, "Campo requerido"),
  estado: z.enum(["pendiente", "pagado", "recibido"]),
  fecha_vencimiento: z.string().optional(),
})

export function EditTransactionSheet({
    transaccion,
    categoriasDisponibles
}: {
    transaccion: any,
    categoriasDisponibles: string[]
}) {
    const [mounted, setMounted] = useState(false)
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [errorInfo, setErrorInfo] = useState<any>(null)
    const [isAiLoading, setIsAiLoading] = useState(false)

    const defaultDate = transaccion.fecha_vencimiento
        ? new Date(transaccion.fecha_vencimiento).toISOString().split('T')[0]
        : ""

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: transaccion.id,
            tipo: transaccion.tipo || "pago",
            montoVisual: formatToCurrencyInput(transaccion.monto),
            descripcion: transaccion.descripcion || "",
            categoria: transaccion.categoria || categoriasDisponibles[0] || "",
            estado: transaccion.estado || "pendiente",
            fecha_vencimiento: defaultDate,
        },
    })

    const descripcion = form.watch("descripcion")

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleAiSuggestion = async () => {
        if (descripcion && descripcion.length > 3) {
            setIsAiLoading(true)
            try {
                const suggestion = await suggestCategory(descripcion, categoriasDisponibles)
                if (suggestion) {
                    form.setValue("categoria", suggestion, { shouldValidate: true })
                    toast.success(`IA sugeriu: ${suggestion}`, {
                        icon: <SparklesIcon className="h-4 w-4 text-primary" />,
                        duration: 2000
                    })
                }
            } catch (err) {
                console.error("AI Error:", err)
            } finally {
                setIsAiLoading(false)
            }
        }
    }

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const formData = new FormData()
        formData.append("id", values.id)
        formData.append("tipo", values.tipo)
        formData.append("monto", unformatCurrency(values.montoVisual))
        formData.append("descripcion", values.descripcion)
        formData.append("categoria", values.categoria)
        formData.append("estado", values.estado)
        if (values.fecha_vencimiento) {
            formData.append("fecha_vencimiento", values.fecha_vencimiento)
        }

        setErrorInfo(null)

        startTransition(async () => {
            const res = await editTransaccion(formData)
            if (res?.error) {
                setErrorInfo(res)
                toast.error(res.error || 'Error ao actualizar')
            } else {
                toast.success('¡Transacción actualizada!')
                setOpen(false)
            }
        })
    }

    // Update form when sheet opens with new transaccion data
    useEffect(() => {
        if (open) {
            form.reset({
                id: transaccion.id,
                tipo: transaccion.tipo || "pago",
                montoVisual: formatToCurrencyInput(transaccion.monto),
                descripcion: transaccion.descripcion || "",
                categoria: transaccion.categoria || categoriasDisponibles[0] || "",
                estado: transaccion.estado || "pendiente",
                fecha_vencimiento: defaultDate,
            })
        }
    }, [open, transaccion, categoriasDisponibles, defaultDate, form])

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50" title="Editar Transacción">
                <EditIcon className="w-4 h-4" />
                <span className="sr-only">Editar</span>
            </Button>
        )
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50" title="Editar Transacción">
                    <EditIcon className="w-4 h-4" />
                    <span className="sr-only">Editar</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto sm:max-w-md">
                <SheetHeader className="mb-6">
                    <SheetTitle>Editar Transacción</SheetTitle>
                    <SheetDescription>
                        Modifica los detalles de este movimiento.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="tipo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pago">Gasto (A Pagar)</SelectItem>
                                                <SelectItem value="cobro">Ingreso (A Cobrar)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="montoVisual"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monto (COP)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ej: 15.000"
                                                {...field}
                                                onChange={(e) => {
                                                    const formatted = formatToCurrencyInput(e.target.value)
                                                    field.onChange(formatted)
                                                }}
                                                inputMode="numeric"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="descripcion"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Alquiler, Mercado, Salario..."
                                            {...field}
                                            onBlur={() => {
                                                field.onBlur()
                                                handleAiSuggestion()
                                            }}
                                            className={isAiLoading ? "animate-pulse border-primary/50" : ""}
                                        />
                                    </FormControl>
                                    {isAiLoading && <p className="text-[10px] text-primary font-medium animate-pulse">IA pensando...</p>}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="categoria"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoría</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categoriasDisponibles.map((cat, idx) => (
                                                    <SelectItem key={idx} value={cat}>{getCategoryWithEmoji(cat)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="estado"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado Actual</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pendiente">Pendiente</SelectItem>
                                                <SelectItem value="pagado">Pagado</SelectItem>
                                                <SelectItem value="recibido">Recibido (Ingreso)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="fecha_vencimiento"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Vencimiento / Pago</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {errorInfo?.error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded text-sm mb-4 mt-2">
                                <p className="font-semibold">{errorInfo.error}</p>
                                {errorInfo.details && <p>{JSON.stringify(errorInfo.details)}</p>}
                            </div>
                        )}

                        <div className="mt-6">
                            <Button type="submit" disabled={isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                {isPending ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}

