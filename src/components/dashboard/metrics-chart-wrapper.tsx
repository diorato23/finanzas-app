import { createClient } from "@/lib/supabase/server"
import { MetricsChart } from "./metrics-chart"

export async function MetricsChartWrapper() {
    const supabase = await createClient()

    // Buscar datos de los últimos 6 meses para el gráfico
    // Como simplificación para este app, vamos a agrupar por mes las transacciones ya existentes
    const { data: transacciones } = await supabase
        .from("transacciones")
        .select("monto, tipo, created_at")
        .order("created_at", { ascending: true })

    // Procesar datos para el formato de Recharts
    const monthsMap: Record<string, { ingresos: number, gastos: number }> = {}

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

    transacciones?.forEach((t) => {
        const date = new Date(t.created_at)
        const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`

        if (!monthsMap[key]) {
            monthsMap[key] = { ingresos: 0, gastos: 0 }
        }

        if (t.tipo === "cobro") {
            monthsMap[key].ingresos += Number(t.monto)
        } else {
            monthsMap[key].gastos += Number(t.monto)
        }
    })

    // Converter para array e pegar os últimos 6 (ou preencher se houver poucos)
    const chartData = Object.entries(monthsMap).map(([date, values]) => ({
        date,
        ...values
    })).slice(-6)

    // Se não houver dados, criar um placeholder bonito
    const finalData = chartData.length > 0 ? chartData : [
        { date: "Ene", ingresos: 0, gastos: 0 },
        { date: "Feb", ingresos: 0, gastos: 0 },
        { date: "Mar", ingresos: 0, gastos: 0 }
    ]

    return <MetricsChart data={finalData} />
}
