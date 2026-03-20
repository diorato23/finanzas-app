import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { addCategoria, deleteCategoria } from "./actions"
import { getCategoryWithEmoji } from "@/lib/utils"
import { DeleteButton } from "@/components/ui/delete-button"

export default async function CategoriasPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: perfil } = await supabase
        .from("perfiles")
        .select("rol, familia_id")
        .eq("id", user.id)
        .single()

    const isAdmin = perfil?.rol === "admin" || perfil?.rol === "co_admin"

    const { data: categorias, error } = await supabase
        .from("categorias")
        .select("*")
        .order("created_at", { ascending: true })

    if (error && error.code !== '42P01') {
        return <div className="p-4 bg-red-50 text-red-600 rounded">Error: {error.message}</div>
    }

    const missingTable = error?.code === '42P01'

    // Contar uso de cada categoria nas transações
    const { data: usoCategorias } = await supabase
        .from("transacciones")
        .select("categoria")
        .eq("familia_id", perfil?.familia_id)

    const contagemUso: Record<string, number> = {}
    usoCategorias?.forEach((t) => {
        if (t.categoria) {
            contagemUso[t.categoria] = (contagemUso[t.categoria] || 0) + 1
        }
    })

    return (
        <div className="space-y-8 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Gestionar Categorías
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                        Organiza y personaliza las categorías usadas en tus transacciones.
                    </p>
                </div>
            </div>

            {missingTable ? (
                <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                        <CardTitle className="text-amber-800">Incompleto: Falta Base de Datos</CardTitle>
                        <CardDescription className="text-amber-700">La tabla &quot;categorias&quot; aún no existe en tu Supabase.</CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Lista de Categorias */}
                    <Card className="rounded-[20px] shadow-sm border-border/50 md:col-span-2 overflow-hidden">
                        <CardHeader className="bg-accent/30 border-b border-border/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                Categorías Registradas
                                <Badge variant="secondary" className="ml-auto font-mono">
                                    {categorias?.length ?? 0}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-full">Nombre de la Categoría</TableHead>
                                    <TableHead className="text-center w-24">Usos</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categorias?.map((c) => {
                                    const usos = contagemUso[c.nombre] || 0
                                    return (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-semibold text-foreground">
                                                {getCategoryWithEmoji(c.nombre)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant={usos > 0 ? "secondary" : "outline"}
                                                    className="font-mono text-xs"
                                                >
                                                    {usos} {usos === 1 ? "uso" : "usos"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isAdmin ? (
                                                    <form action={async () => {
                                                        "use server"
                                                        await deleteCategoria(c.id)
                                                    }}>
                                                        <DeleteButton
                                                            message={
                                                                usos > 0
                                                                    ? `⚠️ La categoría "${c.nombre}" tiene ${usos} transacción(es). ¿Seguro que deseas eliminarla? Las transacciones conservarán su categoría pero quedará sin gestión.`
                                                                    : `¿Seguro que deseas eliminar la categoría "${c.nombre}"?`
                                                            }
                                                        />
                                                    </form>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Oculto</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {categorias?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground shrink-0 border-dashed">
                                            Sin categorías. Agrega una nueva en el formulario adjunto.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* Formulario Nueva Categoria */}
                    <Card className="rounded-[20px] shadow-sm border-border/50 h-fit">
                        <CardHeader>
                            <CardTitle className="text-lg">Nueva Categoría</CardTitle>
                            <CardDescription>Para organizar tus gastos e ingresos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={async (formData) => {
                                "use server"
                                await addCategoria(formData)
                            }} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nombre">Nombre</Label>
                                    <Input
                                        type="text"
                                        id="nombre"
                                        name="nombre"
                                        placeholder="Ej: Gasolina, Supermercado..."
                                        required
                                        disabled={!isAdmin}
                                    />
                                    {!isAdmin && (
                                        <p className="text-xs text-rose-500 font-medium">Solo Administradores pueden crear.</p>
                                    )}
                                </div>
                                <Button type="submit" className="w-full" disabled={!isAdmin}>Guardar</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
