"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function promoteToCoAdmin(formData: FormData) {
    const supabase = await createClient()
    const perfilId = formData.get("perfilId") as string
    const currentRol = formData.get("currentRol") as string

    // Toggle Rol
    const newRol = currentRol === 'co_admin' ? 'dependiente' : 'co_admin'

    const { error } = await supabase
        .from("perfiles")
        .update({ rol: newRol })
        .eq("id", perfilId)

    if (error) {
        console.error("Error updating role:", error)
    }

    revalidatePath("/dashboard/admin")
}

export async function removeMember(formData: FormData) {
    const supabase = await createClient()
    const perfilId = formData.get("perfilId") as string

    // Apenas exclui o link da família (ou o perfil inteiro, apagando assim o vinculo)
    const { error } = await supabase
        .from("perfiles")
        .delete()
        .eq("id", perfilId)

    if (error) {
        console.error("Error removing member:", error)
    }

    // O Auth User ainda existe no Supabase, mas para nosso app ele "já não tem perfil". 
    // Na vida real, chamaríamos uma Server-Side API Admin para deletar auth.users. 
    // Como estamos testando o RLS, isso basta.

    revalidatePath("/dashboard/admin")
}
