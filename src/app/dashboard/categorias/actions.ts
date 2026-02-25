"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const categoriaSchema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
})

export async function addCategoria(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autorizado" }

    const rawData = {
        nombre: formData.get("nombre"),
    }

    const validatedFields = categoriaSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return { error: "Datos inválidos", details: validatedFields.error.flatten().fieldErrors }
    }

    const { data: perfil } = await supabase
        .from("perfiles")
        .select("familia_id, rol")
        .eq("id", user.id)
        .single()

    if (!perfil) return { error: "Perfil no encontrado" }

    if (perfil.rol !== "admin" && perfil.rol !== "co_admin") {
        return { error: "Permiso denegado. Solo admins." }
    }

    const { error } = await supabase
        .from("categorias")
        .insert([{
            nombre: validatedFields.data.nombre,
            familia_id: perfil.familia_id
        }])

    if (error) {
        console.error(error)
        return { error: "Error al guardar la categoría." }
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/categorias")
}

export async function deleteCategoria(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("categorias")
        .delete()
        .eq("id", id)

    if (error) {
        return { error: "Error al eliminar." }
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/categorias")
}
