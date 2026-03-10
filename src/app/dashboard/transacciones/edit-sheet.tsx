"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { editTransaccion } from "./actions"
import { EditIcon } from "lucide-react"
import { getCategoryWithEmoji } from "@/lib/utils"

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

export function EditTransactionSheet({
    transaccion,
    categoriasDisponibles
}: {
    transaccion: any,
    categoriasDisponibles: string[]
}) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [errorInfo, setErrorInfo] = useState<any>(null)
    const [montoVisual, setMontoVisual] = useState(formatToCurrencyInput(transaccion.monto))

    const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setMontoVisual(formatToCurrencyInput(val))
    }

    const handleSubmit = (formData: FormData) => {
        formData.append("id", transaccion.id)
        formData.set("monto", unformatCurrency(montoVisual))

        setErrorInfo(null)
        startTransition(async () => {
            const res = await editTransaccion(formData)
            if (res?.error) {
                setErrorInfo(res)
            } else {
                setOpen(false) // Fecha a gaveta com sucesso
            }
        })
    }

    // Garante que o input date esteja no formato YYYY-MM-DD
    const defaultDate = transaccion.fecha_vencimiento
        ? new Date(transaccion.fecha_vencimiento).toISOString().split('T')[0]
        : ""

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

                <form action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tipo">Tipo</Label>
                            <Select name="tipo" required defaultValue={transaccion.tipo}>
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
                            <input type="hidden" name="monto" value={unformatCurrency(montoVisual)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Input type="text" id="descripcion" name="descripcion" defaultValue={transaccion.descripcion} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="categoria">Categoría</Label>
                            <Select name="categoria" required defaultValue={transaccion.categoria || categoriasDisponibles[0]}>
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
                            <Select name="estado" required defaultValue={transaccion.estado}>
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
                        <Input type="date" id="fecha_vencimiento" name="fecha_vencimiento" defaultValue={defaultDate} />
                    </div>

                    {errorInfo?.error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded text-sm mt-4">
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
            </SheetContent>
        </Sheet>
    )
}
