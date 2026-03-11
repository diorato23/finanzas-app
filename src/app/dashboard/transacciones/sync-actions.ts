"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function syncOfflineTransactions(transactions: any[]) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autorizado" }

    // Obter família do usuário
    const { data: perfil } = await supabase
        .from("perfiles")
        .select("familia_id")
        .eq("id", user.id)
        .single()

    if (!perfil) return { error: "Perfil no encontrado" }

    // Preparar dados para o Supabase
    const dataToInsert = transactions.map(t => ({
        descripcion: t.descripcion,
        monto: t.monto,
        tipo: t.tipo,
        categoria: t.categoria,
        estado: t.estado,
        fecha_vencimiento: t.fecha_vencimiento || null,
        created_at: t.created_at,
        user_id: user.id,
        familia_id: perfil.familia_id
    }))

    const { error } = await supabase
        .from("transacciones")
        .insert(dataToInsert)

    if (error) {
        console.error("Error Sync Offline:", error)
        return { error: "Erro ao sincronizar dados offline." }
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/transacciones")

    return { success: true, count: dataToInsert.length }
}
