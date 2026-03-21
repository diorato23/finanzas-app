import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppBottomNav } from "@/components/app-bottom-nav"
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

        // Verificar trial expirado
        if (perfil) {
            let activeSubscription = perfil.subscription_status
            let activeTrialEndsAt = perfil.trial_ends_at

            // Se não é admin, herda subscription do admin da família
            if (perfil.rol !== 'admin' && perfil.familia_id) {
                const { data: adminPerfil } = await supabase
                    .from("perfiles")
                    .select("subscription_status, trial_ends_at")
                    .eq("familia_id", perfil.familia_id)
                    .eq("rol", "admin")
                    .single()
                
                if (adminPerfil) {
                    activeSubscription = adminPerfil.subscription_status
                    activeTrialEndsAt = adminPerfil.trial_ends_at
                }
            }

            if (activeSubscription === 'trial' && activeTrialEndsAt) {
                const now = new Date()
                const trialEnds = new Date(activeTrialEndsAt)
                if (now > trialEnds) {
                    redirect("/subscription")
                }
            }
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

                <div className="flex flex-1 flex-col min-h-screen min-w-0 overflow-hidden relative pb-[72px] md:pb-0"
                    style={{
                        background: "linear-gradient(160deg, #f0f1f5 0%, #ede9fe 50%, #e0e7ff 100%)"
                    }}
                >
                    <style>{`.dark .dashboard-bg { background: linear-gradient(160deg, #0f172a 0%, #1a1040 50%, #1e1b4b 100%) !important; }`}</style>
                    {/* Header Superior — glassmorphism sticky */}
                    <header data-glass className="print:hidden sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8 py-4 shrink-0 h-[70px]"
                        style={{
                            background: "rgba(255,255,255,0.65)",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            borderBottom: "1px solid rgba(79,70,229,0.12)",
                            boxShadow: "0 1px 24px 0 rgba(79,70,229,0.06)"
                        }}
                    >
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
        // NEXT_REDIRECT é uma exceção interna do Next.js — deve ser re-lançada
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
        }
        // Verificação adicional pelo digest (compatibilidade com versões do Next.js)
        if (typeof error === 'object' && error !== null && 'digest' in error) {
            const digest = (error as { digest?: string }).digest
            if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
                throw error
            }
        }
        const err = error instanceof Error ? error : new Error(String(error))
        return (
            <div className="p-10 bg-red-100 text-red-900 border-2 border-red-500 rounded-lg m-4">
                <h1 className="text-xl font-bold mb-2">ERRO FATAL NO LAYOUT</h1>
                <pre className="whitespace-pre-wrap text-sm">{err.stack || err.message || String(err)}</pre>
            </div>
        )
    }
}
