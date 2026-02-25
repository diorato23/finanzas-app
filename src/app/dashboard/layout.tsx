import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppBottomNav } from "@/components/app-bottom-nav"
import { Moon, Sun } from "lucide-react"
import { HeaderThemeToggle } from "@/components/header-theme-toggle"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: perfil } = await supabase
        .from("perfiles")
        .select("*, familias(nombre)")
        .eq("id", user.id)
        .single()

    if (!perfil) {
        return <div className="p-8 text-center text-muted-foreground">Cargando perfil...</div>
    }

    const isAdmin = perfil.rol === "admin" || perfil.rol === "co_admin"
    const hasFamily = !!perfil.familias

    return (
        <SidebarProvider>
            <AppSidebar />

            <div className="flex flex-1 flex-col min-h-screen min-w-0 bg-background overflow-hidden relative pb-[72px] md:pb-0">
                {/* Header Superior (Mais limpo) */}
                <header className="print:hidden flex items-center justify-between px-4 sm:px-8 py-4 bg-card border-b border-border/50 shrink-0 h-[70px]">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger className="md:hidden" />
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            ¡Hola, {perfil.nombre.split(' ')[0]}!
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                        <HeaderThemeToggle />
                    </div>
                </header>

                {/* Área de rolagem principal */}
                <main className="flex-1 overflow-y-auto w-full">
                    {children}
                </main>

                {/* Navbar Inferior (Apenas Mobile) */}
                <div className="print:hidden">
                    <AppBottomNav isAdmin={isAdmin} hasFamily={hasFamily} />
                </div>
            </div>
        </SidebarProvider>
    )
}
