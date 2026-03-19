import { createClient } from "@/lib/supabase/server"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { ClientTable } from "./client-table"

export default async function TransaccionesPage() {
    const supabase = await createClient()

    const { data: transacciones, error } = await supabase
        .from("transacciones")
        .select("*, perfiles!user_id(nombre)")
        .order("created_at", { ascending: false })

    // Cargar categorías dinámicas del banco
    const { data: categoriasRows } = await supabase
        .from("categorias")
        .select("nombre")
        .order("nombre", { ascending: true })

    const baseCategories = ["Alimentación", "Vivienda", "Suscripciones", "Transporte", "Salud", "Ingresos", "Otros"]
    let storedCatNames: string[] = []

    if (categoriasRows && categoriasRows.length > 0) {
        storedCatNames = categoriasRows.map(c => c.nombre)
    }

    // Mezcla las bases nativas de la plataforma + las creadas por el usuario (eliminando duplicados)
    const categoriasDisponibles = Array.from(new Set([...baseCategories, ...storedCatNames]))

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 shadow-sm">
                <h3 className="font-bold">Error al cargar transacciones</h3>
                <p className="text-sm mt-1">{error.message}</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Historial de Transacciones
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                        Revisa tus últimos movimientos e ingresos registrados.
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-full shadow-sm">
                        <Link href="/dashboard/transacciones/nueva">
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Nueva Transacción
                        </Link>
                    </Button>
                </div>
            </div>

            <Card className="rounded-[20px] shadow-sm border-border/50 overflow-hidden">
                <CardHeader className="bg-accent/30 border-b border-border/50 pb-4">
                    <CardTitle className="text-lg">Todos los movimientos</CardTitle>
                </CardHeader>
                <ClientTable 
                    transacciones={transacciones || []} 
                    categoriasDisponibles={categoriasDisponibles} 
                />
            </Card>
        </div>
    )
}
