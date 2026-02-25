"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const transaccionSchema = z.object({
    descripcion: z.string().min(2, "La descripción es muy corta"),
    monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
    tipo: z.enum(["pago", "cobro"]),
    fecha_vencimiento: z.string().optional(),
    categoria: z.string().min(2, "Selecciona una categoría válida"),
    estado: z.enum(["pendiente", "pagado", "recibido"]),
})

export async function createTransaccion(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autorizado" }

    const rawData = {
        descripcion: formData.get("descripcion"),
        monto: formData.get("monto"),
        tipo: formData.get("tipo"),
        fecha_vencimiento: formData.get("fecha_vencimiento") || null,
        categoria: formData.get("categoria"),
        estado: formData.get("estado"),
    }

    const validatedFields = transaccionSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return { error: "Datos inválidos", details: validatedFields.error.flatten().fieldErrors }
    }

    // Get User's Family ID
    const { data: perfil } = await supabase
        .from("perfiles")
        .select("familia_id")
        .eq("id", user.id)
        .single()

    if (!perfil) return { error: "Perfil no encontrado" }

    const { error } = await supabase
        .from("transacciones")
        .insert([{
            ...validatedFields.data,
            user_id: user.id,
            familia_id: perfil.familia_id
        }])

    if (error) {
        console.error(error)
        return { error: "Error al guardar la transacción." }
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/transacciones")
    redirect("/dashboard/transacciones")
}

export async function editTransaccion(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autorizado" }

    const id = formData.get("id") as string
    if (!id) return { error: "ID de transacción faltante" }

    const rawData = {
        descripcion: formData.get("descripcion"),
        monto: formData.get("monto"),
        tipo: formData.get("tipo"),
        fecha_vencimiento: formData.get("fecha_vencimiento") || null,
        categoria: formData.get("categoria"),
        estado: formData.get("estado"),
    }

    const validatedFields = transaccionSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return { error: "Datos inválidos", details: validatedFields.error.flatten().fieldErrors }
    }

    const { error } = await supabase
        .from("transacciones")
        .update({
            ...validatedFields.data
        })
        .eq("id", id)
    // ensure user can only edit transactions they have access to (RLS normally handles this, but good practice)

    if (error) {
        console.error("Error al actualizar la transacción:", error)
        return { error: "Error al actualizar la transacción." }
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/transacciones")
    revalidatePath("/dashboard/informes")

    return { success: true }
}

export async function updateTransaccionEstado(id: string, nuevoEstado: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("transacciones")
        .update({ estado: nuevoEstado })
        .eq("id", id)

    if (error) {
        return { error: "Error al actualizar." }
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/transacciones")
}

export async function deleteTransaccion(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("transacciones")
        .delete()
        .eq("id", id)

    if (error) {
        return { error: "Error al eliminar." }
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/transacciones")
}
