"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addPresupuesto } from "./actions"
import { PlusCircle } from "lucide-react"
import { useSyncExternalStore } from "react"
import { getCategoryWithEmoji } from "@/lib/utils"

export function PresupuestoClientForm({
    selectedMonth,
    allCategories
}: {
    selectedMonth: string
    allCategories: string[]
}) {
    const mounted = useSyncExternalStore(
        () => () => {
            // no-op
        },
        () => true,
        () => false
    )

    if (!mounted) return null

    return (
        <Card className="rounded-[20px] border-border/50 shadow-sm sticky top-6">
            <CardHeader className="bg-primary/5 border-b border-border/50 rounded-t-[20px]">
                <CardTitle className="flex items-center gap-2 text-primary text-lg">
                    <PlusCircle className="w-5 h-5" />
                    Límite de Categoría
                </CardTitle>
                <CardDescription>Establece un techo de gastos para {selectedMonth}.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <form action={async (fw) => { await addPresupuesto(fw) }} className="space-y-4">
                    <input type="hidden" name="mes_anio" value={selectedMonth} />

                    <div className="space-y-2">
                        <Label htmlFor="categoria">Categoría</Label>
                        <Select name="categoria" required>
                            <SelectTrigger id="categoria">
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allCategories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{getCategoryWithEmoji(cat)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="monto_limite">Monto Máximo (COP)</Label>
                        <Input
                            id="monto_limite"
                            name="monto_limite"
                            type="number"
                            min="0"
                            step="1000"
                            placeholder="500000"
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full">
                        Guardar Presupuesto
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
