import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { InformeClient, CategoriaData } from "./client-informes"

export type IntegranteData = {
    id: string
    nombre: string
    rol: string
}

export default async function InformesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: perfil } = await supabase
        .from("perfiles")
        .select("familia_id, rol")
        .eq("id", user.id)
        .single()

    if (!perfil) redirect("/dashboard")

    const isAdmin = perfil.rol === 'admin' || perfil.rol === 'co_admin'

    // Buscar integrantes da família (apenas visível ao admin)
    let integrantes: IntegranteData[] = []
    if (isAdmin && perfil.familia_id) {
        const { data: membros } = await supabase
            .from("perfiles")
            .select("id, nombre, rol")
            .eq("familia_id", perfil.familia_id)
            .order("nombre", { ascending: true })

        integrantes = membros ?? []
    }

    // Obter as categorias ativas do usuário para preencher o filtro
    const { data: categorias } = await supabase
        .from("categorias")
        .select("nombre")
        .order("nombre", { ascending: true })

    const baseCategories = ["Alimentación", "Vivienda", "Suscripciones", "Transporte", "Salud", "Ingresos", "Otros"]
    let storedCatNames: string[] = []

    if (categorias && categorias.length > 0) {
        storedCatNames = categorias.map(c => c.nombre)
    }

    const categoriasLista = Array.from(new Set([...baseCategories, ...storedCatNames]))
    const categories: CategoriaData[] = categoriasLista.map(nombre => ({ nombre }))

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-6 print:pb-0">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
                <div className="px-1">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Informes</h2>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Genera análisis gráficos de tus {isAdmin ? "finanzas familiares" : "finanzas personales"} por periodo.
                    </p>
                </div>
            </div>

            <InformeClient categories={categories} integrantes={integrantes} />
        </div>
    )
}
