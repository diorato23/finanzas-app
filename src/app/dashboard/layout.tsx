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
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
            return <div className="p-10 bg-red-50 text-red-800">Erro de Autenticação: {authError.message}</div>
        }

        if (!user) {
            redirect("/login")
        }

        let perfil = null
        try {
            const { data, error: profileError } = await supabase
                .from("perfiles")
                .select("*, familias(nombre)")
                .eq("id", user.id)
                .single()
            
            if (profileError) console.error("Erro Supabase Perfil:", profileError)
            perfil = data
        } catch (e: unknown) {
            console.error("Erro ao buscar perfil:", e)
        }

        const safePerfil = perfil || {
            nombre: "Usuario Temporario",
            rol: "dependiente",
            subscription_status: "active",
            familias: null
        }

        const isAdmin = safePerfil.rol === "admin" || safePerfil.rol === "co_admin"
        const hasFamily = !!safePerfil.familias

        return (
            <SidebarProvider>
                <AppSidebar />

                <div className="flex flex-1 flex-col min-h-screen min-w-0 bg-background overflow-hidden relative pb-[72px] md:pb-0">
                    {/* Header Superior */}
                    <header className="print:hidden flex items-center justify-between px-4 sm:px-8 py-4 bg-card border-b border-border/50 shrink-0 h-[70px]">
                        <div className="flex items-center gap-3">
                            <SidebarTrigger className="md:hidden" />
                            <h1 className="text-xl font-bold tracking-tight text-foreground">
                                ¡Hola, {safePerfil?.nombre?.split(' ')[0] || 'Usuário'}!
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
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error))
        return (
            <div className="p-10 bg-red-100 text-red-900 border-2 border-red-500 rounded-lg m-4">
                <h1 className="text-xl font-bold mb-2">ERRO FATAL NO LAYOUT</h1>
                <pre className="whitespace-pre-wrap text-sm">{err.stack || err.message || String(err)}</pre>
            </div>
        )
    }
}
