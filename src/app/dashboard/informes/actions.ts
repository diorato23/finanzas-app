"use server"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const informeSchema = z.object({
    fechaInicio: z.string(),
    fechaFin: z.string(),
    agruparPor: z.string().default("mes"),
    categoria: z.string().optional()
})

export async function generarInforme(formData: FormData) {
    const result = informeSchema.safeParse({
        fechaInicio: formData.get("fechaInicio"),
        fechaFin: formData.get("fechaFin"),
        agruparPor: formData.get("agruparPor"),
        categoria: formData.get("categoria")
    })

    if (!result.success) {
        return { error: "Datos de formulario inválidos." }
    }

    const { fechaInicio, fechaFin, categoria } = result.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado." }

    const { data: perfil } = await supabase
        .from("perfiles")
        .select("familia_id, rol")
        .eq("id", user.id)
        .single()

    if (!perfil) return { error: "Perfil no encontrado." }

    const isAdmin = perfil.rol === 'admin' || perfil.rol === 'co_admin'
    let query = supabase
        .from("transacciones")
        .select("tipo, monto, created_at, categoria")
        .eq("familia_id", perfil.familia_id)
        .gte("created_at", `${fechaInicio}T00:00:00`)
        .lte("created_at", `${fechaFin}T23:59:59`)

    if (!isAdmin) {
        query = query.eq("user_id", user.id)
    }

    if (categoria && categoria !== "todas") {
        query = query.eq("categoria", categoria)
    }

    const { data: transacciones, error } = await query
    if (error) return { error: "Error al buscar transacciones." }

    const start = new Date(fechaInicio + "T00:00:00")
    const end = new Date(fechaFin + "T23:59:59")
    const agruparPor = result.data.agruparPor || "mes"

    const arrayData: Record<string, { ingresos: number, gastos: number, label: string }> = {}

    if (transacciones) {
        transacciones.forEach(t => {
            const date = new Date(t.created_at)
            const amount = Number(t.monto)

            let key = ""
            let label = ""

            if (agruparPor === "mes") {
                key = date.toISOString().slice(0, 7) // 2026-02
                const monthKey = date.toLocaleString('es-CO', { month: 'short', year: '2-digit' })
                label = monthKey.charAt(0).toUpperCase() + monthKey.slice(1)
            } else if (agruparPor === "semana") {
                const day = date.getDay()
                const diff = date.getDate() - day + (day === 0 ? -6 : 1) // monday
                const monday = new Date(date)
                monday.setDate(diff)
                key = monday.toISOString().slice(0, 10) // 2026-02-16
                const shortDate = monday.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
                label = `Semana ${shortDate}`
            } else if (agruparPor === "categoria") {
                key = t.categoria || "Otros"
                label = key
            }

            if (!arrayData[key]) {
                arrayData[key] = { ingresos: 0, gastos: 0, label }
            }

            if (t.tipo === 'cobro') {
                arrayData[key].ingresos += amount
            } else {
                arrayData[key].gastos += amount
            }
        })
    }

    // Pre-fill ranges para gráficos temporais continuos do chart
    if (agruparPor === "mes" || agruparPor === "semana") {
        let current = new Date(start)
        if (agruparPor === "mes") {
            current = new Date(current.getFullYear(), current.getMonth(), 1)
        } else {
            const day = current.getDay()
            const diff = current.getDate() - day + (day === 0 ? -6 : 1)
            current = new Date(current.setDate(diff))
        }

        while (current <= end) {
            let key = ""
            let label = ""
            if (agruparPor === "mes") {
                key = current.toISOString().slice(0, 7)
                const monthKey = current.toLocaleString('es-CO', { month: 'short', year: '2-digit' })
                label = monthKey.charAt(0).toUpperCase() + monthKey.slice(1)
                if (!arrayData[key]) arrayData[key] = { ingresos: 0, gastos: 0, label }
                current = new Date(current.getFullYear(), current.getMonth() + 1, 1) // próximo mês
            } else {
                key = current.toISOString().slice(0, 10)
                const shortDate = current.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
                label = `Semana ${shortDate}`
                if (!arrayData[key]) arrayData[key] = { ingresos: 0, gastos: 0, label }
                current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 7) // próxima semana
            }
        }
    }

    // Sort by key, which will naturally sort dates correctly (YYYY-MM or YYYY-MM-DD), and alphabetize categories
    const chartData = Object.keys(arrayData).sort().map(key => ({
        mes: arrayData[key].label,
        ingresos: arrayData[key].ingresos,
        gastos: arrayData[key].gastos
    }))

    return { success: true, data: chartData }
}
