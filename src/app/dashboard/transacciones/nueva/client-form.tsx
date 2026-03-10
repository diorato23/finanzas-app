"use client"

import { useTransition, useState } from "react"
import { createTransaccion } from "../actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCategoryWithEmoji } from "@/lib/utils"

const formatToCurrencyInput = (value: string) => {
    // 1. Remove anything that isn't a digit
    const cleaned = value.replace(/\D/g, "")
    if (!cleaned) return ""
    // 2. Parse entirely as an integer
    const number = parseInt(cleaned, 10)
    // 3. Format back to standard locale representation integer-only (since minimum is COP 1, we don't care about strict cents handling until it's displayed, but let's emulate the ",00")
    // Actually, typical COP representation: $ 15.000 (No decimals used generally).
    // Let's format as a standard dot-separated integer.
    const formatted = new Intl.NumberFormat('es-CO').format(number)
    return formatted
}

export default function NuevaTransaccionClient({ categoriasDisponibles }: { categoriasDisponibles: string[] }) {
    const [isPending, startTransition] = useTransition()
    const [errorInfo, setErrorInfo] = useState<any>(null)
    const [montoVisual, setMontoVisual] = useState("")

    const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setMontoVisual(formatToCurrencyInput(val))
    }

    const unformatCurrency = (formatted: string) => {
        return formatted.replace(/\D/g, "")
    }

    const handleSubmit = (formData: FormData) => {
        // Enforce the raw value into formData programmatically before dispatching
        formData.set("monto", unformatCurrency(montoVisual))

        const promise = () => new Promise(async (resolve, reject) => {
            const res = await createTransaccion(formData)
            if (res?.error) {
                setErrorInfo(res)
                reject(res.error)
            } else {
                resolve(res)
            }
        })

        toast.promise(promise(), {
            loading: 'Guardando transacción...',
            success: '¡Transacción guardada con éxito!',
            error: (err) => err || 'Error al guardar la transacción',
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

            <Card className="rounded-[20px]">
                <CardHeader>
                    <CardTitle>Detalles</CardTitle>
                    <CardDescription>Completa todos los campos para mayor precisión.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tipo">Tipo</Label>
                                <Select name="tipo" required defaultValue="pago">
                                    <SelectTrigger id="tipo">
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pago">Gasto (A Pagar)</SelectItem>
                                        <SelectItem value="cobro">Ingreso (A Cobrar)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="monto">Monto (COP)</Label>
                                {/* Required visible input that formats user typing */}
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    id="montoVisual"
                                    name="montoVisual"
                                    placeholder="Ej: 15.000"
                                    required
                                    value={montoVisual}
                                    onChange={handleMontoChange}
                                />
                                {/* Hidden input providing strictly the numeric value '15000' to the FormData */}
                                <input type="hidden" name="monto" value={unformatCurrency(montoVisual)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="descripcion">Descripción</Label>
                            <Input type="text" id="descripcion" name="descripcion" placeholder="Alquiler, Mercado, Salario..." required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="categoria">Categoría</Label>
                                <Select name="categoria" required defaultValue={categoriasDisponibles[0]}>
                                    <SelectTrigger id="categoria">
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categoriasDisponibles.map((cat, idx) => (
                                            <SelectItem key={idx} value={cat}>{getCategoryWithEmoji(cat)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="estado">Estado Actual</Label>
                                <Select name="estado" required defaultValue="pendiente">
                                    <SelectTrigger id="estado">
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pendiente">Pendiente</SelectItem>
                                        <SelectItem value="pagado">Pagado</SelectItem>
                                        <SelectItem value="recibido">Recibido (Ingreso)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento / Pago</Label>
                            <Input type="date" id="fecha_vencimiento" name="fecha_vencimiento" />
                        </div>

                        {errorInfo?.error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded text-sm">
                                <p className="font-semibold">{errorInfo.error}</p>
                                {/* if validation errors */}
                                {errorInfo.details && <p>{JSON.stringify(errorInfo.details)}</p>}
                            </div>
                        )}

                        <Button type="submit" disabled={isPending} className="w-full">
                            {isPending ? "Guardando..." : "Guardar Transacción"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
