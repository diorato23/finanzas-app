import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { WalletIcon, TrendingUp, TrendingDown, PlusIcon, ListIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SummaryCard } from "@/components/summary-card"

function formatCOP(amount: number) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(amount)
}

export default async function DashboardPage() {
    const supabase = await createClient()

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    const { data: transacciones, error } = await supabase
        .from("transacciones")
        .select("*")
        .gte("created_at", firstDayOfMonth)
        .lte("created_at", lastDayOfMonth)

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 shadow-sm">
                <h3 className="font-bold">Error al cargar datos</h3>
                <p className="text-sm mt-1">{error.message}</p>
            </div>
        )
    }

    let totalCobrado = 0
    let totalPagado = 0
    let totalIngresos = 0
    let totalGastos = 0

    transacciones?.forEach((t) => {
        if (t.tipo === 'cobro') {
            totalIngresos += Number(t.monto)
            if (t.estado === 'recibido') totalCobrado += Number(t.monto)
        }
        if (t.tipo === 'pago') {
            totalGastos += Number(t.monto)
            if (t.estado === 'pagado') totalPagado += Number(t.monto)
        }
    })

    const saldoActual = totalCobrado - totalPagado

    return (
        <div className="space-y-8 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Resumen Financiero
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                        Mes actual: {now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-full shadow-sm">
                        <Link href="/dashboard/transacciones/nueva">
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Nueva Transacción
                        </Link>
                    </Button>
                </div>
            </div>

            {/* SUMMARY CARDS (Agente Financeiro UX) */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SummaryCard
                    title="Saldo Total"
                    amount={saldoActual}
                    icon={WalletIcon}
                    variant="default"
                    description="Efetivo actual disponível"
                />
                <SummaryCard
                    title="Ingresos"
                    amount={totalIngresos}
                    icon={TrendingUp}
                    variant="success"
                    description="Total esperado este mes"
                />
                <SummaryCard
                    title="Gastos"
                    amount={totalGastos}
                    icon={TrendingDown}
                    variant="danger"
                    description="Total agendado este mes"
                />
            </div>

            {/* SEÇÃO INFERIOR */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-1 lg:col-span-2 rounded-[20px] shadow-sm border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Últimos Movimientos</CardTitle>
                        <CardDescription>
                            {transacciones?.length || 0} transacciones este mes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {transacciones?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-accent/30 rounded-xl border border-dashed border-border">
                                <ListIcon className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
                                <p className="text-sm font-medium text-muted-foreground">No hay movimientos registrados.</p>
                                <Button variant="link" asChild className="mt-2 text-primary">
                                    <Link href="/dashboard/transacciones/nueva">Crear la primera transacción</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="text-sm">
                                <Link
                                    href="/dashboard/transacciones"
                                    className="flex items-center justify-center w-full py-3 bg-accent/50 hover:bg-accent rounded-xl text-primary font-medium transition-colors"
                                >
                                    <ListIcon className="w-4 h-4 mr-2" />
                                    Módulo de Transacciones Completas
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-[20px] shadow-sm border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Acceso Rápido</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start rounded-xl h-12 border-border/50" asChild>
                            <Link href="/dashboard/transacciones/nueva">
                                <PlusIcon className="w-4 h-4 mr-2 text-primary" />
                                <span className="font-medium text-foreground">Agregar Ingreso</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start rounded-xl h-12 border-border/50" asChild>
                            <Link href="/dashboard/transacciones/nueva">
                                <PlusIcon className="w-4 h-4 mr-2 text-rose-500" />
                                <span className="font-medium text-foreground">Agregar Gasto</span>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
