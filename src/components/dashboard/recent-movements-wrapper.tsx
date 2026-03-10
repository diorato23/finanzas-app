import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ListIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export async function RecentMovementsWrapper() {
    const supabase = await createClient()
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    const { data: transacciones } = await supabase
        .from("transacciones")
        .select("*")
        .gte("created_at", firstDayOfMonth)
        .lte("created_at", lastDayOfMonth)
        .order("created_at", { ascending: false })
        .limit(10)

    return (
        <Card className="col-span-1 lg:col-span-2 rounded-[20px] shadow-sm border-border/50 bg-card/30 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-lg">Últimos Movimientos</CardTitle>
                <CardDescription>
                    {transacciones?.length || 0} transacciones este mes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {transacciones?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-accent/30 rounded-xl border border-dashed border-border">
                        <ListIcon className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
                        <p className="text-sm font-medium text-muted-foreground">No hay movimentos registrados.</p>
                        <Button variant="link" asChild className="mt-2 text-primary">
                            <Link href="/dashboard/transacciones/nueva">Crear la primera transacción</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="text-sm">
                        <Link
                            href="/dashboard/transacciones"
                            className="flex items-center justify-center w-full py-3 bg-accent/50 hover:bg-accent rounded-xl text-primary font-medium transition-colors"
                        >
                            <ListIcon className="w-4 h-4 mr-2" />
                            Módulo de Transacciones Completas
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
