import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, TrashIcon, CheckCircleIcon } from "lucide-react"
import { updateTransaccionEstado, deleteTransaccion } from "./actions"
import { EditTransactionSheet } from "./edit-sheet"
import { getCategoryWithEmoji } from "@/lib/utils"

function formatCOP(amount: number) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(amount)
}

export default async function TransaccionesPage() {
    const supabase = await createClient()

    const { data: transacciones, error } = await supabase
        .from("transacciones")
        .select("*, perfiles(nombre)")
        .order("created_at", { ascending: false })

    // Carregar categorias dinâmicas do banco
    const { data: categoriasRows } = await supabase
        .from("categorias")
        .select("nombre")
        .order("nombre", { ascending: true })

    const baseCategories = ["Alimentación", "Vivienda", "Suscripciones", "Transporte", "Salud", "Ingresos", "Otros"]
    let storedCatNames: string[] = []

    if (categoriasRows && categoriasRows.length > 0) {
        storedCatNames = categoriasRows.map(c => c.nombre)
    }

    // Mescla as bases nativas da plataforma + as criadas pelo usuário (removendo duplicações)
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
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold text-muted-foreground">Fecha/Vence</TableHead>
                                <TableHead className="font-semibold text-muted-foreground">Descripción</TableHead>
                                <TableHead className="font-semibold text-muted-foreground hidden md:table-cell">Categoría</TableHead>
                                <TableHead className="font-semibold text-muted-foreground hidden lg:table-cell">Responsable</TableHead>
                                <TableHead className="font-semibold text-muted-foreground">Monto</TableHead>
                                <TableHead className="font-semibold text-muted-foreground text-center">Estado</TableHead>
                                <TableHead className="font-semibold text-muted-foreground text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transacciones?.map((t) => {
                                const isIncome = t.tipo === "cobro"
                                return (
                                    <TableRow key={t.id} className="group hover:bg-accent/30 transition-colors">
                                        <TableCell>
                                            <div className="text-sm font-medium">
                                                {new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short' }).format(new Date(t.created_at))}
                                            </div>
                                            {t.fecha_vencimiento && (
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    Vence: {new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(t.fecha_vencimiento))}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {t.descripcion}
                                            <div className="md:hidden text-xs text-muted-foreground mt-0.5">
                                                {getCategoryWithEmoji(t.categoria)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                            <span className="bg-secondary px-2 py-1 rounded-md border border-border/50">{getCategoryWithEmoji(t.categoria)}</span>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                            {t.perfiles?.nombre || 'Desconocido'}
                                        </TableCell>
                                        <TableCell className={`font-bold tracking-tight ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {isIncome ? '+' : '-'} {formatCOP(t.monto)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {t.estado === 'pendiente' && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Pendiente</Badge>}
                                            {t.estado === 'pagado' && <Badge variant="default" className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 shadow-none border-0">Pagado</Badge>}
                                            {t.estado === 'recibido' && <Badge variant="default" className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 shadow-none border-0">Recibido</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                {t.estado === 'pendiente' && (
                                                    <form action={async () => {
                                                        "use server"
                                                        const nuevo = isIncome ? 'recibido' : 'pagado'
                                                        await updateTransaccionEstado(t.id, nuevo)
                                                    }}>
                                                        <Button variant="ghost" size="icon" type="submit" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Marcar como Listo">
                                                            <CheckCircleIcon className="w-4 h-4" />
                                                            <span className="sr-only">Listo</span>
                                                        </Button>
                                                    </form>
                                                )}
                                                <EditTransactionSheet transaccion={t} categoriasDisponibles={categoriasDisponibles} />
                                                <form action={async () => {
                                                    "use server"
                                                    await deleteTransaccion(t.id)
                                                }}>
                                                    <Button variant="ghost" size="icon" type="submit" className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50" title="Eliminar Transacción">
                                                        <TrashIcon className="w-4 h-4" />
                                                        <span className="sr-only">Eliminar</span>
                                                    </Button>
                                                </form>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {transacciones?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                        Ninguna transacción registrada todavía.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}
