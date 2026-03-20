"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { TrashIcon, TrendingUp, TrendingDown } from "lucide-react"
import { EditTransactionSheet } from "./edit-sheet"
import { getCategoryWithEmoji } from "@/lib/utils"
import { deleteTransaccion } from "./actions"
import { useTransition } from "react"
import { toast } from "sonner"
import { EmptyState } from "@/components/ui/empty-state"
import { useRouter } from "next/navigation"
import { SafeDate } from "@/components/ui/safe-date"

function formatCOP(amount: number) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(amount)
}

interface ClientTableProps {
    transacciones: TransaccionClientRow[]
    categoriasDisponibles: string[]
}

type TransaccionClientRow = {
    id: string
    tipo: "pago" | "cobro" | string
    monto: number
    descripcion: string
    categoria: string
    estado: "pendiente" | "pagado" | "recibido" | string
    created_at: string
    perfiles?: { nombre?: string | null } | null
}

export function ClientTable({ transacciones, categoriasDisponibles }: ClientTableProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

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

    if (transacciones.length === 0) {
        return (
            <div className="p-8">
                <EmptyState onAction={() => router.push("/dashboard/transacciones/nueva")} />
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <Table className="table-fixed w-full">
                <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider w-[58px]">Fecha</TableHead>
                        <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Descripción</TableHead>
                        <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell w-[130px]">Categoría</TableHead>
                        <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell w-[110px]">Responsable</TableHead>
                        <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right w-[105px]">Monto</TableHead>
                        <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right w-[72px]">Acciones</TableHead>
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
                                    <TableCell className="py-3 px-3">
                                        <SafeDate>
                                            <div className="text-xs font-medium text-muted-foreground">
                                                {new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short' }).format(new Date(t.created_at))}
                                            </div>
                                        </SafeDate>
                                    </TableCell>
                                    <TableCell className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isIncome ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                                                {isIncome 
                                                    ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> 
                                                    : <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                                                }
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{t.descripcion}</p>
                                                {/* Mobile: mostra categoria + responsável abaixo da descrição */}
                                                <div className="lg:hidden flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                    <span className="text-xs bg-secondary px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground">{getCategoryWithEmoji(t.categoria)}</span>
                                                    {t.perfiles?.nombre && (
                                                        <span className="text-xs text-muted-foreground/70">· {t.perfiles.nombre}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    {/* Desktop: colunas separadas */}
                                    <TableCell className="hidden lg:table-cell py-3 px-3">
                                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground">{getCategoryWithEmoji(t.categoria)}</span>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell py-3 px-3 text-xs text-muted-foreground truncate">
                                        {t.perfiles?.nombre || '—'}
                                    </TableCell>
                                    <TableCell className={`py-3 px-3 text-right font-bold text-sm tabular-nums ${isIncome ? 'text-emerald-600' : 'text-rose-500'}`}>
                                        {formatCOP(t.monto)}
                                    </TableCell>
                                    <TableCell className="py-3 px-3 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <EditTransactionSheet transaccion={t} categoriasDisponibles={categoriasDisponibles} />
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleDelete(t.id)}
                                                disabled={isPending}
                                                className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20" 
                                                title="Eliminar Transacción"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                                <span className="sr-only">Eliminar</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </motion.tr>
                            )
                        })}
                    </AnimatePresence>
                </TableBody>
            </Table>
        </div>
    )
}
