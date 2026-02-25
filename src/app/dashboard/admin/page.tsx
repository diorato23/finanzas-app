import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { promoteToCoAdmin, removeMember } from "./actions"
import { TrashIcon, UsersIcon, ShieldAlert } from "lucide-react"

export default async function FamiliaPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Obter Perfil
    const { data: perfil } = await supabase
        .from("perfiles")
        .select("*, familias(nombre, id)")
        .eq("id", user.id)
        .single()

    if (!perfil || perfil.rol !== 'admin') {
        redirect("/dashboard") // Sólo administradores pueden ver esta página
    }

    const familiaId = perfil.familias?.id

    // Obter miembros
    const { data: miembros } = await supabase
        .from("perfiles")
        .select("*")
        .eq("familia_id", familiaId)

    const dependientesCount = miembros?.filter(m => m.rol !== 'admin').length || 0

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Gestión Familiar</h2>
                <p className="text-muted-foreground">
                    Administra los miembros y accesos de la {perfil.familias?.nombre}
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="rounded-[20px] border-border/50 shadow-sm">
                    <CardHeader className="bg-primary/5 border-b border-border/50 rounded-t-[20px]">
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <span className="p-1.5 bg-primary/10 rounded-md"><UsersIcon className="w-5 h-5" /></span>
                            Código de Invitación
                        </CardTitle>
                        <CardDescription>Comparte este código con tus dependientes para que se registren.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border/50">
                            <code className="font-mono text-sm font-bold text-foreground select-all tracking-tight">
                                {familiaId}
                            </code>
                        </div>
                        <p className="text-[13px] font-medium text-muted-foreground mt-4 flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-amber-500" />
                            Límite de la cuenta: <strong className="text-foreground">{dependientesCount} / 5</strong> dependientes.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-[20px] border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-accent/30 border-b border-border/50">
                    <CardTitle className="text-lg flex items-center gap-2">Miembros Actuales</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[40%]">Nombre</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Ingreso</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {miembros?.map((m) => (
                                <TableRow key={m.id} className="group">
                                    <TableCell className="font-semibold text-foreground">{m.nombre}</TableCell>
                                    <TableCell>
                                        <Badge variant={m.rol === 'admin' ? 'default' : (m.rol === 'co_admin' ? 'secondary' : 'outline')} className="rounded-md">
                                            {m.rol === 'admin' ? 'Administrador' : (m.rol === 'co_admin' ? 'Co-Administrador' : 'Dependiente')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{new Date(m.created_at).toLocaleDateString('es-CO')}</TableCell>
                                    <TableCell className="text-right">
                                        {m.rol !== 'admin' && (
                                            <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <form action={promoteToCoAdmin}>
                                                    <input type="hidden" name="perfilId" value={m.id} />
                                                    <input type="hidden" name="currentRol" value={m.rol} />
                                                    <Button variant="ghost" size="sm" type="submit" className="text-xs h-8 text-primary hover:text-primary hover:bg-primary/10">
                                                        {m.rol === 'co_admin' ? 'Quitar Co-Admin' : 'Hacer Co-Admin'}
                                                    </Button>
                                                </form>
                                                <form action={removeMember}>
                                                    <input type="hidden" name="perfilId" value={m.id} />
                                                    <Button variant="ghost" size="icon" type="submit" className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50" title="Remover">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </Button>
                                                </form>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}
