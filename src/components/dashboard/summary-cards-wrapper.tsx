import { SummaryCard } from "@/components/summary-card"
import { WalletIcon, TrendingUp, TrendingDown, Scale } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export async function SummaryCardsWrapper() {
    const supabase = await createClient()
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    const { data: transacciones } = await supabase
        .from("transacciones")
        .select("*")
        .gte("created_at", firstDayOfMonth)
        .lte("created_at", lastDayOfMonth)

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
    const saldoNeto = totalIngresos - totalGastos
    const saldoPositivo = saldoNeto >= 0

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
                title="Ingresos del Mes"
                amount={totalIngresos}
                icon={TrendingUp}
                variant="success"
                description="Total de ingresos registrados"
                href="/dashboard/transacciones"
            />
            <SummaryCard
                title="Gastos del Mes"
                amount={totalGastos}
                icon={TrendingDown}
                variant="danger"
                description="Total de gastos registrados"
                href="/dashboard/transacciones"
            />
            <SummaryCard
                title="Saldo Disponible"
                amount={saldoActual}
                icon={WalletIcon}
                variant="default"
                description="Recibido menos pagado"
            />
            <SummaryCard
                title="Balance Neto"
                amount={saldoNeto}
                icon={Scale}
                variant={saldoPositivo ? "success" : "danger"}
                description={saldoPositivo ? "¡Mes positivo! 🎉" : "Gastos superan ingresos"}
            />
        </div>
    )
}
