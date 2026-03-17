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
        } catch (e: any) {
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
            <div className="p-8">
                <h1 className="text-2xl font-bold">Modo de Diagnóstico V2</h1>
                <p>Usuário ID: {user?.id}</p>
                <div className="mt-4 p-4 border rounded bg-card">
                    <h2 className="font-bold">Dados do Perfil:</h2>
                    <pre className="text-xs overflow-auto">{JSON.stringify(safePerfil, null, 2)}</pre>
                </div>
                <main className="mt-8 border-t pt-8">
                    {children}
                </main>
            </div>
        )
    } catch (error: any) {
        return (
            <div className="p-10 bg-red-100 text-red-900 border-2 border-red-500 rounded-lg m-4">
                <h1 className="text-xl font-bold mb-2">ERRO FATAL NO LAYOUT</h1>
                <pre className="whitespace-pre-wrap text-sm">{error.stack || error.message || String(error)}</pre>
            </div>
        )
    }
}
