"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const presupuestoSchema = z.object({
    categoria: z.string().min(1, "Selecciona una categoría"),
    monto_limite: z.coerce.number().min(1, "El monto debe ser mayor a 0"),
    mes_anio: z.string().regex(/^\d{4}-\d{2}$/, "Formato inválido (YYYY-MM)")
})

export async function addPresupuesto(formData: FormData) {
    const supabase = await createClient()

    const result = presupuestoSchema.safeParse({
        categoria: formData.get("categoria"),
        monto_limite: formData.get("monto_limite"),
        mes_anio: formData.get("mes_anio"),
    } as unknown)

    if (!result.success) {
        return { error: result.error.issues[0].message }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado" }

    const { data: perfil } = await supabase
        .from("perfiles")
        .select("familia_id, rol")
        .eq("id", user.id)
        .single()

    if (!perfil) return { error: "Perfil no encontrado" }

    if (perfil.rol !== 'admin' && perfil.rol !== 'co_admin') {
        return { error: "No tienes permisos" }
    }

    // A lógica onConflict requiere passar um objeto exato pra key ou verificar existencia antes se on_conflict der problema.
    // Vamos fazer insert com onConflict
    const { error } = await supabase
        .from("presupuestos")
        .upsert({
            familia_id: perfil.familia_id,
            categoria: result.data.categoria,
            monto_limite: result.data.monto_limite,
            mes_anio: result.data.mes_anio
        }, { onConflict: 'familia_id, categoria, mes_anio' })

    if (error) {
        // Fallback p/ Supabase instances antigas sem unique onConflict support:
        const { data: exist } = await supabase.from('presupuestos')
            .select('id').eq('familia_id', perfil.familia_id).eq('categoria', result.data.categoria).eq('mes_anio', result.data.mes_anio).single()

        if (exist) {
            await supabase.from('presupuestos').update({ monto_limite: result.data.monto_limite }).eq('id', exist.id)
        } else {
            await supabase.from("presupuestos").insert({
                familia_id: perfil.familia_id,
                categoria: result.data.categoria,
                monto_limite: result.data.monto_limite,
                mes_anio: result.data.mes_anio
            })
        }
    }

    revalidatePath("/dashboard/presupuestos")
    return { success: true }
}

export async function deletePresupuesto(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get("id") as string
    if (!id) return { error: "ID Inválido" }

    await supabase.from("presupuestos").delete().eq("id", id)

    revalidatePath("/dashboard/presupuestos")
    return { success: true }
}
