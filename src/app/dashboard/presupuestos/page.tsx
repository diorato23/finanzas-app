import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrashIcon, AlertCircle, TrendingDown } from "lucide-react"
import { deletePresupuesto } from "./actions"
import { PresupuestoClientForm } from "./client-form"
import { getCategoryWithEmoji } from "@/lib/utils"

export default async function PresupuestosPage({ searchParams }: { searchParams: Promise<{ mes_anio?: string }> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: perfil } = await supabase
        .from("perfiles")
        .select("*, familias(nombre, id)")
        .eq("id", user.id)
        .single()

    if (!perfil) {
        redirect("/dashboard")
    }

    const familiaId = perfil.familias?.id
    const isAdmin = perfil.rol === 'admin' || perfil.rol === 'co_admin'

    // Fallback date picker
    const today = new Date()
    const currentMonth = today.toISOString().slice(0, 7) // '2026-02'

    const resolvedParams = await searchParams
    const selectedMonth = resolvedParams?.mes_anio || currentMonth

    // Get Categories
    const { data: categoriasData } = await supabase
        .from("categorias")
        .select("nombre")
        .eq("familia_id", familiaId)

    const baseCategories = ["Alimentación", "Vivienda", "Suscripciones", "Transporte", "Salud", "Ingresos", "Otros"]
    const storedCatNames = categoriasData?.map(c => c.nombre) || []
    const allCategories = Array.from(new Set([...baseCategories, ...storedCatNames]))

    // Get Presupuestos do mes atual
    const { data: presupuestos, error: presErr } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("familia_id", familiaId)
        .eq("mes_anio", selectedMonth)

    const orcamentosSeguros = presErr ? [] : (presupuestos || [])

    // Get Gastos do mes atual 
    // Data inicio e fim do selectedMonth
    const [year, month] = selectedMonth.split('-')
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString()
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString()

    const { data: transacciones } = await supabase
        .from("transacciones")
        .select("categoria, monto")
        .eq("familia_id", familiaId)
        .eq("tipo", "pago")
        .gte("fecha_vencimiento", startDate)
        .lte("fecha_vencimiento", endDate)

    // Agregar Gastos por Categoria
    const gastosPorCategoria: Record<string, number> = {}
    transacciones?.forEach(t => {
        gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + Number(t.monto)
    })

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Presupuestos</h2>
                    <p className="text-muted-foreground mt-1">
                        Administra los límites de gastos de tu familia. Selecciona un mes para visualizar.
                    </p>
                </div>

                <form className="flex items-center gap-2 max-w-xs w-full" method="get">
                    <Label htmlFor="mes_anio" className="sr-only">Mes</Label>
                    <Input
                        id="mes_anio"
                        name="mes_anio"
                        type="month"
                        defaultValue={selectedMonth}
                        className="bg-card w-full"
                    />
                    <Button type="submit" variant="secondary">Ver</Button>
                </form>
            </div>

            {presErr && (
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 p-4 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <div className="text-sm font-medium">
                        La base de datos aún no cuenta con la tabla de presupuestos. Pide al Desarrollador aplicar la migración `20260225044500_add_presupuestos_table.sql` con URGÊNCIA.
                    </div>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">

                {/* Lista de Presupuestos (Tarjetas Grandes) */}
                <div className="md:col-span-2 space-y-4">
                    {orcamentosSeguros.length === 0 && !presErr ? (
                        <div className="text-center p-12 bg-card rounded-[20px] border border-border/50 shadow-sm">
                            <TrendingDown className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-foreground">Sin presupuestos en este mes</h3>
                            <p className="text-muted-foreground text-sm mt-1">Crea un nuevo límite para comenzar a monitorear tus gastos.</p>
                        </div>
                    ) : (
                        orcamentosSeguros.map((pres) => {
                            const gasto = gastosPorCategoria[pres.categoria] || 0
                            const limite = Number(pres.monto_limite)
                            const percentage = limite > 0 ? Math.min(100, Math.round((gasto / limite) * 100)) : 100

                            const isOver = gasto > limite
                            const isWarning = percentage >= 80 && !isOver

                            let progressColor = "bg-primary"
                            if (isWarning) progressColor = "bg-amber-500"
                            if (isOver) progressColor = "bg-rose-500"

                            return (
                                <Card key={pres.id} className="rounded-[20px] shadow-sm border-border/50 overflow-hidden">
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold text-lg text-foreground">{getCategoryWithEmoji(pres.categoria)}</h3>
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    {formatCurrency(gasto)} gastados de {formatCurrency(limite)}
                                                </p>
                                            </div>
                                            {isAdmin && (
                                                <form action={async (formData) => {
                                                    "use server"
                                                    await deletePresupuesto(formData)
                                                }}>
                                                    <input type="hidden" name="id" value={pres.id} />
                                                    <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 -mt-1 -mr-1">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </Button>
                                                </form>
                                            )}
                                        </div>

                                        <div className="mt-4 space-y-1.5">
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span className={isOver ? "text-rose-500" : isWarning ? "text-amber-500" : "text-primary"}>
                                                    {percentage}% utilizado
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {isOver ? "Excedido!" : `Restan ${formatCurrency(limite - gasto)}`}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>

                {/* Formulario Adicionar */}
                {isAdmin && (
                    <div className="md:col-span-1">
                        <PresupuestoClientForm
                            selectedMonth={selectedMonth}
                            allCategories={allCategories}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
