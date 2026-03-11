import { SummaryCard } from "@/components/summary-card"
import { WalletIcon, TrendingUp, TrendingDown } from "lucide-react"
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

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard
                title="Saldo Total"
                amount={saldoActual}
                icon={WalletIcon}
                variant="default"
                description="Efectivo actual disponible"
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
    )
}
