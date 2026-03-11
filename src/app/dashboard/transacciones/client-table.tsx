"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircleIcon, TrashIcon } from "lucide-react"
import { EditTransactionSheet } from "./edit-sheet"
import { getCategoryWithEmoji } from "@/lib/utils"
import { updateTransaccionEstado, deleteTransaccion } from "./actions"
import { useTransition } from "react"
import { toast } from "sonner"

function formatCOP(amount: number) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(amount)
}

interface ClientTableProps {
    transacciones: any[]
    categoriasDisponibles: string[]
}

export function ClientTable({ transacciones, categoriasDisponibles }: ClientTableProps) {
    const [isPending, startTransition] = useTransition()

    const handleUpdateEstado = async (id: string, nuevoEstado: string) => {
        startTransition(async () => {
            const res = await updateTransaccionEstado(id, nuevoEstado)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success("Estado actualizado")
            }
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta transacción?")) return
        startTransition(async () => {
            const res = await deleteTransaccion(id)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success("Transacción eliminada")
            }
        })
    }

    return (
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
                <TableBody className="relative">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {transacciones.map((t) => {
                            const isIncome = t.tipo === "cobro"
                            return (
                                <motion.tr
                                    key={t.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 30,
                                        mass: 1
                                    }}
                                    className="group border-b transition-colors hover:bg-accent/30 data-[state=selected]:bg-muted"
                                >
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
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleUpdateEstado(t.id, isIncome ? 'recibido' : 'pagado')}
                                                    disabled={isPending}
                                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" 
                                                    title="Marcar como Listo"
                                                >
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                    <span className="sr-only">Listo</span>
                                                </Button>
                                            )}
                                            <EditTransactionSheet transaccion={t} categoriasDisponibles={categoriasDisponibles} />
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleDelete(t.id)}
                                                disabled={isPending}
                                                className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50" 
                                                title="Eliminar Transacción"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                                <span className="sr-only">Eliminar</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </motion.tr>
                            )
                        })}
                    </AnimatePresence>
                    {transacciones.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                Ninguna transacción registrada todavía.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
