"use server"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const informeSchema = z.object({
    fechaInicio: z.string(),
    fechaFin: z.string(),
    agruparPor: z.string().default("mes"),
    categoria: z.string().optional(),
    userId: z.string().optional()
})

export async function generarInforme(formData: FormData) {
    const result = informeSchema.safeParse({
        fechaInicio: formData.get("fechaInicio"),
        fechaFin: formData.get("fechaFin"),
        agruparPor: formData.get("agruparPor") || undefined,
        categoria: formData.get("categoria") || undefined,
        userId: formData.get("userId") || undefined
    })

    if (!result.success) {
        console.error("Zod Validation Error:", result.error.format())
        return { error: "Datos de formulario inválidos." }
    }

    const { fechaInicio, fechaFin, categoria, userId } = result.data

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

    // Buscar nome do integrante filtrado (se for o caso)
    let memberName: string | null = null
    if (isAdmin && userId && userId !== 'todos') {
        const { data: memberPerfil } = await supabase
            .from("perfiles")
            .select("nombre")
            .eq("id", userId)
            .single()
        memberName = memberPerfil?.nombre ?? null
    }

    let query = supabase
        .from("transacciones")
        .select("tipo, monto, created_at, categoria, user_id")
        .eq("familia_id", perfil.familia_id)
        .gte("created_at", `${fechaInicio}T00:00:00`)
        .lte("created_at", `${fechaFin}T23:59:59`)

    // Filtro por integrante: admin filtra por userId selecionado, dependente sempre vê só o próprio
    if (isAdmin && userId && userId !== 'todos') {
        query = query.eq("user_id", userId)
    } else if (!isAdmin) {
        query = query.eq("user_id", user.id)
    }

    if (categoria && categoria !== "todas") {
        query = query.eq("categoria", categoria)
    }

    const { data: transacciones, error } = await query
    if (error) return { error: "Error al buscar transacciones." }

    const agruparPor = result.data.agruparPor || "mes"
    
    // Contenedores para diferentes tipos de análisis
    const timelineData: Record<string, { ingresos: number, gastos: number, label: string }> = {}
    const userComparisonMap: Record<string, { total: number, nombre: string }> = {}
    const categoryDetailMap: Record<string, { total: number, count: number }> = {}
    let totalGastosGeral = 0
    let totalIngresosGeral = 0

    // Buscar todos os integrantes para ter os nomes, mesmo que não tenham transações
    const { data: members } = await supabase
        .from("perfiles")
        .select("id, nombre")
        .eq("familia_id", perfil.familia_id)

    if (members) {
        members.forEach(m => {
            userComparisonMap[m.id] = { total: 0, nombre: m.nombre }
        })
    }

    if (transacciones) {
        transacciones.forEach(t => {
            const date = new Date(t.created_at)
            const amount = Number(t.monto)

            // 1. Processamento Cronológico (Chart Central)
            let key = ""
            let label = ""
            if (agruparPor === "mes") {
                key = date.toISOString().slice(0, 7)
                const monthKey = date.toLocaleString('es-CO', { month: 'short', year: '2-digit' })
                label = monthKey.charAt(0).toUpperCase() + monthKey.slice(1)
            } else if (agruparPor === "semana") {
                const day = date.getDay()
                const diff = date.getDate() - day + (day === 0 ? -6 : 1)
                const monday = new Date(date)
                monday.setDate(diff)
                key = monday.toISOString().slice(0, 10)
                label = `Sem. ${monday.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}`
            } else {
                key = t.categoria || "Otros"
                label = key
            }

            if (!timelineData[key]) timelineData[key] = { ingresos: 0, gastos: 0, label }
            
            // 2. Acumuladores Globais
            if (t.tipo === 'cobro') {
                timelineData[key].ingresos += amount
                totalIngresosGeral += amount
            } else {
                timelineData[key].gastos += amount
                totalGastosGeral += amount

                // 3. Comparação de usuários (apenas gastos)
                if (userComparisonMap[t.user_id]) {
                    userComparisonMap[t.user_id].total += amount
                }
            }

            // 4. Detalhamento por Categoria (sempre processado para a tabela)
            if (t.tipo === 'gasto' || t.tipo === 'pago') {
                const cat = t.categoria || "Otros"
                if (!categoryDetailMap[cat]) categoryDetailMap[cat] = { total: 0, count: 0 }
                categoryDetailMap[cat].total += amount
                categoryDetailMap[cat].count += 1
            }
        })
    }

    const start = new Date(fechaInicio + "T00:00:00")
    const end = new Date(fechaFin + "T23:59:59")

    // Pre-fill ranges para timeline
    if (agruparPor === "mes" || agruparPor === "semana") {
        let current = new Date(start)
        if (agruparPor === "mes") current = new Date(current.getFullYear(), current.getMonth(), 1)
        else {
            const day = current.getDay()
            current.setDate(current.getDate() - day + (day === 0 ? -6 : 1))
        }

        while (current <= end) {
            let key = ""
            let label = ""
            if (agruparPor === "mes") {
                key = current.toISOString().slice(0, 7)
                const monthKey = current.toLocaleString('es-CO', { month: 'short', year: '2-digit' })
                label = monthKey.charAt(0).toUpperCase() + monthKey.slice(1)
                if (!timelineData[key]) timelineData[key] = { ingresos: 0, gastos: 0, label }
                current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
            } else {
                key = current.toISOString().slice(0, 10)
                label = `Sem. ${current.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}`
                if (!timelineData[key]) timelineData[key] = { ingresos: 0, gastos: 0, label }
                current.setDate(current.getDate() + 7)
            }
        }
    }

    // Formatação final dos dados
    const chartData = Object.keys(timelineData).sort().map(key => ({
        mes: timelineData[key].label,
        ingresos: timelineData[key].ingresos,
        gastos: timelineData[key].gastos
    }))

    const categoriesList = Object.keys(categoryDetailMap)
        .map(cat => ({
            nombre: cat,
            total: categoryDetailMap[cat].total,
            count: categoryDetailMap[cat].count,
            porcentaje: totalGastosGeral > 0 ? (categoryDetailMap[cat].total / totalGastosGeral) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total)
    
    const userComparison = Object.keys(userComparisonMap).map(id => ({
        nombre: userComparisonMap[id].nombre,
        total: userComparisonMap[id].total
    })).sort((a,b) => b.total - a.total)

    return { 
        success: true, 
        data: chartData, 
        memberName,
        summary: {
            totalIngresos: totalIngresosGeral,
            totalGastos: totalGastosGeral,
            balance: totalIngresosGeral - totalGastosGeral
        },
        categoryDetail: categoriesList,
        userComparison
    }
}
