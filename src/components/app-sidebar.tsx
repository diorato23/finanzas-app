"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Wallet,
    LayoutDashboard,
    List,
    BarChart2,
    PieChart,
    Users,
    Tag,
    Shield,
    LogOut,
    ChevronRight,
    WalletIcon,
    TagsIcon,
    LineChart
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const router = useRouter()
    const [isAdmin, setIsAdmin] = React.useState(false)
    const [hasFamily, setHasFamily] = React.useState(false)
    const [userName, setUserName] = React.useState("Usuario")
    const [userRole, setUserRole] = React.useState("—")
    const supabase = createClient()

    React.useEffect(() => {
        async function loadUserAccess() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: perfil } = await supabase
                .from("perfiles")
                .select("rol, nombre, familia_id")
                .eq("id", user.id)
                .single()

            if (perfil) {
                setUserName(perfil.nombre || "Usuario")
                setIsAdmin(perfil.rol === "admin" || perfil.rol === "co_admin")
                setHasFamily(!!perfil.familia_id)

                const roleLabel = perfil.rol === "admin" ? "Administrador" :
                    perfil.rol === "co_admin" ? "Co-Administrador" : "Dependiente"
                setUserRole(roleLabel)
            }
        }
        loadUserAccess()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    const items = [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Transacciones",
            url: "/dashboard/transacciones",
            icon: List,
        },
        {
            title: "Presupuestos",
            url: "/dashboard/presupuestos",
            icon: PieChart,
        },
        {
            title: "Informes",
            url: "/dashboard/informes",
            icon: LineChart,
        },
        {
            title: "Categorías",
            url: "/dashboard/categorias",
            icon: Tag,
        },
        ...(isAdmin && hasFamily ? [{
            title: "Dependientes",
            url: "/dashboard/admin",
            icon: Users,
        }] : []),
    ]

    return (
        <Sidebar className="border-r border-border-light bg-card" {...props}>
            <div className="absolute inset-x-0 top-0 h-[160px] bg-gradient-to-br from-primary-bg to-transparent pointer-events-none" />

            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex flex-row items-center justify-between px-3 py-4 relative z-10 text-primary font-bold text-lg tracking-tight">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary text-white p-1 rounded-sm">
                                    <Wallet className="size-5" />
                                </div>
                                <span className="truncate">Finanzas</span>
                            </div>
                            <ThemeToggle />
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarMenu className="gap-1 px-3">
                    {items.map((item) => {
                        const isActive = pathname === item.url
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    tooltip={item.title}
                                    className={`relative overflow-hidden transition-all duration-200 group ${isActive
                                        ? "text-primary font-semibold before:absolute before:inset-0 before:bg-primary/10 before:rounded-md after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-[3px] after:h-[60%] after:bg-primary after:rounded-l-sm"
                                        : "text-muted-foreground hover:text-primary hover:before:absolute hover:before:inset-0 hover:before:bg-primary/5 hover:before:rounded-md"
                                        }`}
                                >
                                    <a href={item.url} className="flex items-center gap-3 py-3 w-full relative z-10">
                                        <item.icon className="size-4 shrink-0 transition-transform group-hover:scale-110" />
                                        <span className="text-[13.5px] font-medium tracking-wide">{item.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="border-t border-border-light p-4">
                <div className="flex items-center gap-3 p-3 rounded-md bg-accent/50 mb-3 relative z-10 shadow-sm border border-border/50">
                    <div className="size-10 shrink-0 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-primary/20">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm text-foreground truncate">
                            {userName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                            {userRole}
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-secondary text-secondary-foreground border border-border hover:bg-accent hover:text-accent-foreground hover:border-border-light transition-colors text-sm font-medium relative z-10"
                >
                    <LogOut className="size-4" />
                    <span>Cerrar Sesión</span>
                </button>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
