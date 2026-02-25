"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    List,
    Users,
    Tag,
    PieChart,
    LineChart
} from "lucide-react"

export function AppBottomNav({ isAdmin, hasFamily }: { isAdmin: boolean, hasFamily: boolean }) {
    const pathname = usePathname()

    const navItems = [
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
            icon: Tag, // Utilizando uma Tag simples importada nativamente
        },
        ...(isAdmin && hasFamily ? [{
            title: "Dependientes",
            url: "/dashboard/admin",
            icon: Users,
        }] : []),
    ]

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-card border-t border-border-light flex items-center justify-around px-2 z-50 pb-safe">
            {navItems.map((item) => {
                const isActive = pathname === item.url
                const Icon = item.icon

                return (
                    <Link
                        key={item.title}
                        href={item.url}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <div className={`relative p-1.5 rounded-full transition-all ${isActive ? "bg-primary/10" : ""}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                            {item.title}
                        </span>
                    </Link>
                )
            })}
        </nav>
    )
}
