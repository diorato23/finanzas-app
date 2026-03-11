"use client"

import { useTransition, useState } from "react"
import { createTransaccion } from "../actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCategoryWithEmoji } from "@/lib/utils"
import { suggestCategory } from "@/app/actions/ai-categorize"
import { parseTransactionText } from "@/app/actions/parse-bank-sms"
import { SparklesIcon } from "lucide-react"

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

const formatToCurrencyInput = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    if (!cleaned) return ""
    const number = parseInt(cleaned, 10)
    return new Intl.NumberFormat('es-CO').format(number)
}

const unformatCurrency = (formatted: string) => {
    return formatted.replace(/\D/g, "")
}

const formSchema = z.object({
  tipo: z.enum(["pago", "cobro"]),
  montoVisual: z.string().min(1, "Campo requerido"),
  descripcion: z.string().min(1, "Campo requerido"),
  categoria: z.string().min(1, "Campo requerido"),
  estado: z.enum(["pendiente", "pagado", "recibido"]),
  fecha_vencimiento: z.string().optional(),
})

export default function NuevaTransaccionClient({ categoriasDisponibles }: { categoriasDisponibles: string[] }) {
    const [isPending, startTransition] = useTransition()
    const [errorInfo, setErrorInfo] = useState<any>(null)
    const [isAiLoading, setIsAiLoading] = useState(false)
    const [rawSms, setRawSms] = useState("")
    const [isAiParsing, setIsAiParsing] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tipo: "pago",
            montoVisual: "",
            descripcion: "",
            categoria: categoriasDisponibles[0] || "",
            estado: "pendiente",
            fecha_vencimiento: "",
        },
    })

    const descripcion = form.watch("descripcion")

    const handleMagia = async () => {
        if (!rawSms) return
        setIsAiParsing(true)
        try {
            const res = await parseTransactionText(rawSms, categoriasDisponibles)
            if (res.success && res.data) {
                const aiData = res.data
                
                if (aiData.type === "expense") form.setValue("tipo", "pago")
                if (aiData.type === "income") form.setValue("tipo", "cobro")
                
                form.setValue("montoVisual", formatToCurrencyInput(aiData.amount.toString()))
                form.setValue("descripcion", aiData.description)
                
                // Allow user to see the suggested category that was returned
                if (aiData.suggestedCategory && categoriasDisponibles.includes(aiData.suggestedCategory)) {
                    form.setValue("categoria", aiData.suggestedCategory)
                } else {
                    form.setValue("categoria", aiData.suggestedCategory) // Will fallback to what's generated
                }

                if (aiData.date) {
                    form.setValue("fecha_vencimiento", aiData.date)
                }
                
                toast.success("¡Datos extraídos con éxito!", {
                    icon: <SparklesIcon className="h-4 w-4 text-primary" />,
                })
                setRawSms("")
            } else {
                toast.error(res.error || "No se pudo extraer los datos.")
            }
        } catch (error) {
            console.error("Error Magic Button:", error)
            toast.error("Hubo un error al procesar el texto.")
        } finally {
            setIsAiParsing(false)
        }
    }

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
            const res = await createTransaccion(formData)
            if (res?.error) {
                setErrorInfo(res)
                toast.error(res.error || 'Error al guardar la transacción')
            } else {
                toast.success('¡Transacción guardada con éxito!')
                form.reset()
            }
        })
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Nueva Transacción</h2>
                <p className="text-muted-foreground">
                    Agrega un nuevo ingreso o gasto al grupo familiar.
                </p>
            </div>

            <Card className="rounded-[20px] bg-indigo-50/50 border-indigo-100 overflow-hidden">
                <CardHeader className="pb-3 border-b border-indigo-100/50 bg-indigo-50">
                    <CardTitle className="text-lg flex items-center gap-2 text-indigo-700">
                        <SparklesIcon className="h-5 w-5" />
                        Botão Mágico (IA)
                    </CardTitle>
                    <CardDescription className="text-indigo-600/80">
                        Pega aquí el SMS o texto de Nequi, Daviplata, Bancolombia...
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="flex gap-2">
                        <textarea 
                            placeholder="Ej: ¡Listo! Pagaste $ 18.500 en RAPPI S.A.S con tu Tarjeta Nequi..."
                            value={rawSms}
                            onChange={(e) => setRawSms(e.target.value)}
                            className="flex min-h-[60px] w-full rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors"
                        />
                        <Button 
                            type="button" 
                            onClick={handleMagia} 
                            disabled={isAiParsing || !rawSms}
                            className="bg-indigo-600 hover:bg-indigo-700 h-auto font-medium shadow-sm transition-all"
                        >
                            {isAiParsing ? "Pensando..." : "Extraer"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-[20px]">
                <CardHeader>
                    <CardTitle>Detalles</CardTitle>
                    <CardDescription>Completa todos los campos para mayor precisión.</CardDescription>
                </CardHeader>
                <CardContent>
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

                            <div className="pt-2">
                                <Button type="submit" disabled={isPending} className="w-full">
                                    {isPending ? "Guardando..." : "Guardar Transacción"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

