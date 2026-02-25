import { createClient } from "@/lib/supabase/server"
import NuevaTransaccionClient from "./client-form"

export default async function NuevaTransaccion() {
    const supabase = await createClient()

    // Carregar categorias dinâmicas do banco
    const { data: categorias, error } = await supabase
        .from("categorias")
        .select("nombre")
        .order("nombre", { ascending: true })

    // Falback visual listado se a tabela nao existir (42P01) 
    const isMissingTable = error?.code === "42P01"

    const baseCategories = ["Alimentación", "Vivienda", "Suscripciones", "Transporte", "Salud", "Ingresos", "Otros"]
    let storedCatNames: string[] = []

    if (categorias && categorias.length > 0) {
        storedCatNames = categorias.map(c => c.nombre)
    }

    // Mescla as bases nativas da plataforma + as criadas pelo usuário (removendo duplicações)
    let categoriasLista = Array.from(new Set([...baseCategories, ...storedCatNames]))

    if (isMissingTable) {
        categoriasLista = ["Falta configurar DB (Categorias)"]
    }

    return (
        <NuevaTransaccionClient categoriasDisponibles={categoriasLista} />
    )
}
