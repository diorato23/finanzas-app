import { createClient } from "@/lib/supabase/server"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { ClientTable } from "./client-table"

const PAGE_SIZE = 20

export default async function TransaccionesPage({
    searchParams,
}: {
    searchParams: Promise<{ mes?: string; pagina?: string }>
}) {
    const supabase = await createClient()
    const resolved = await searchParams

    // Período selecionado (padrão = mês atual)
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const selectedMonth = resolved?.mes || currentMonth

    const [year, month] = selectedMonth.split("-").map(Number)
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate   = new Date(year, month, 0, 23, 59, 59).toISOString()

    // Paginação
    const page = Math.max(1, parseInt(resolved?.pagina || "1", 10))
    const from = (page - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    // Query com filtro + paginação
    const { data: transacciones, error, count } = await supabase
        .from("transacciones")
        .select("*, perfiles!user_id(nombre)", { count: "exact" })
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false })
        .range(from, to)

    const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

    // Categorias disponíveis
    const { data: categoriasRows } = await supabase
        .from("categorias")
        .select("nombre")
        .order("nombre", { ascending: true })

    const baseCategories = ["Alimentación", "Vivienda", "Suscripciones", "Transporte", "Salud", "Ingresos", "Otros"]
    const storedCatNames = categoriasRows?.map((c) => c.nombre) ?? []
    const categoriasDisponibles = Array.from(new Set([...baseCategories, ...storedCatNames]))

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 shadow-sm">
                <h3 className="font-bold">Error al cargar transacciones</h3>
                <p className="text-sm mt-1">{error.message}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Historial de Transacciones
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                        {count ?? 0} movimiento{(count ?? 0) !== 1 ? "s" : ""} en {new Date(year, month - 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-full shadow-sm">
                    <Link href="/dashboard/transacciones/nueva">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Nueva Transacción
                    </Link>
                </Button>
            </div>

            {/* Filtro de Período */}
            <form method="get" className="flex items-end gap-3 flex-wrap">
                <input type="hidden" name="pagina" value="1" />
                <div className="flex flex-col gap-1">
                    <Label htmlFor="mes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Período
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id="mes"
                            name="mes"
                            type="month"
                            defaultValue={selectedMonth}
                            className="bg-card w-44 rounded-xl border-border/60"
                        />
                        <Button type="submit" variant="secondary" className="rounded-xl">
                            Filtrar
                        </Button>
                        {selectedMonth !== currentMonth && (
                            <Button asChild variant="ghost" size="sm" className="rounded-xl text-muted-foreground">
                                <Link href="/dashboard/transacciones">Hoy</Link>
                            </Button>
                        )}
                    </div>
                </div>
            </form>

            {/* Tabela */}
            <Card className="rounded-[20px] shadow-sm border-border/50 overflow-hidden">
                <CardHeader className="bg-accent/30 border-b border-border/50 pb-4">
                    <CardTitle className="text-lg">Movimientos</CardTitle>
                </CardHeader>
                <ClientTable
                    transacciones={transacciones || []}
                    categoriasDisponibles={categoriasDisponibles}
                />
            </Card>

            {/* Paginação */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 pt-2">
                    <span className="text-sm text-muted-foreground">
                        Página {page} de {totalPages}
                    </span>
                    <div className="flex gap-2">
                        {page > 1 && (
                            <Button asChild variant="outline" size="sm" className="rounded-xl gap-1">
                                <Link href={`?mes=${selectedMonth}&pagina=${page - 1}`}>
                                    <ChevronLeftIcon className="w-4 h-4" />
                                    Anterior
                                </Link>
                            </Button>
                        )}
                        {page < totalPages && (
                            <Button asChild variant="outline" size="sm" className="rounded-xl gap-1">
                                <Link href={`?mes=${selectedMonth}&pagina=${page + 1}`}>
                                    Siguiente
                                    <ChevronRightIcon className="w-4 h-4" />
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
