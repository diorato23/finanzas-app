"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function login(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    // To match Next.js action requirements, redirect on error instead of returning objects.
    if (error) {
        redirect("/login?error=Credenciales+inválidas")
    }

    revalidatePath("/", "layout")
    redirect("/dashboard")
}

export async function signup(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const nombre = formData.get("nombre") as string
    const familiaNombre = formData.get("familia") as string // Si existe, es titular
    const codigoFamilia = formData.get("codigo_familia") as string // Si existe, es dependiente
    const whatsapp = formData.get("whatsapp") as string // Opcional o requerido según UI

    const supabase = await createClient()

    // 1. Validar límite de 5 dependientes si está usando código
    if (codigoFamilia) {
        const { count, error: countErr } = await supabase
            .from('perfiles')
            .select('*', { count: 'exact', head: true })
            .eq('familia_id', codigoFamilia)
            .neq('rol', 'admin') // cuenta cuántos no son admin

        if (countErr) redirect("/login?error=Código+de+familia+no+válido")
        if (count !== null && count >= 5) {
            redirect("/login?error=Esta+familia+ya+alcanzó+el+límite+de+5+dependientes.")
        }
    }

    // 2. Sign Up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    })

    if (authError || !authData.user) {
        console.error("Signup error details:", authError, authData)
        const errMsj = encodeURIComponent(authError?.message || "Error al registrarse")
        redirect(`/login?error=${errMsj}`)
    }

    // 2.5 Manejo de sesión después del registro
    // En muchos proyectos Supabase ya devuelve una sesión válida en signUp
    // (cuando no se requiere confirmación de email). Solo forzamos login si
    // no hay sesión pero está permitido hacerlo.
    if (!authData.session) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        // Si el proyecto exige confirmación de e‑mail, este login va a fallar.
        // En ese caso, enviamos o usuário de volta pra tela de login com msg clara.
        if (loginError || !loginData.session) {
            const msg = encodeURIComponent(
                "Revisa tu correo para confirmar tu cuenta antes de iniciar sesión."
            )
            redirect(`/login?error=${msg}`)
        }
    }

    let finalFamiliaId = codigoFamilia

    // 3. Crear Familia si es Titular
    if (familiaNombre && !codigoFamilia) {
        const { data: famData, error: famError } = await supabase
            .from('familias')
            .insert([{ nombre: familiaNombre, admin_id: authData.user.id }])
            .select()
            .single()

        if (famError) {
            console.error("Error creating familia:", famError)
            const msg = encodeURIComponent("Error al crear la familia: " + famError.message)
            redirect(`/login?error=${msg}`)
        }
        finalFamiliaId = famData.id
    }

    // 4. Create Perfil
    const rol = familiaNombre ? 'admin' : 'dependiente'
    // Trial period calculation (1 day for testing)
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 24 * 60 * 60000).toISOString();

    const { error: perfError } = await supabase
        .from('perfiles')
        .insert([{
            id: authData.user.id,
            familia_id: finalFamiliaId,
            rol: rol,
            nombre: nombre,
            whatsapp: whatsapp || null,
            subscription_status: 'trial',
            trial_ends_at: trialEndsAt
        }])

    if (perfError) {
        console.error(">>> [FATAL] START DATABASE ERROR on Perfiles Insert:")
        console.error("User ID:", authData.user.id)
        console.error("Familia ID:", finalFamiliaId)
        console.error("Role:", rol)
        console.error(perfError)
        console.error("<<< END DATABASE ERROR")
        redirect("/login?error=Error+al+crear+tu+perfil")
    }

    revalidatePath("/", "layout")
    redirect("/dashboard")
}
