"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from 'next/dynamic'
import { 
    TrendingUp, 
    TrendingDown, 
    ArrowRightLeft, 
    Printer, 
    FileText, 
    Users, 
    Calendar, 
    Tag,
    ChevronRight,
    PieChart as PieChartIcon,
    BarChart3
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { IntegranteData } from "./page"
import { getCategoryWithEmoji } from "@/lib/utils"

// Recharts Dynamic Imports
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false })
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false })

type InformeData = {
    mes: string
    ingresos: number
    gastos: number
}

type CategoryDetail = {
    nombre: string
    total: number
    count: number
    porcentaje: number
}

type UserComparison = {
    nombre: string
    total: number
}

type InformeResponse = {
    data: InformeData[]
    categoryDetail: CategoryDetail[]
    userComparison: UserComparison[]
    summary: {
        totalIngresos: number
        totalGastos: number
        balance: number
    }
    memberName: string | null
}

export function InformeClient({ categories, integrantes }: { categories: { nombre: string }[], integrantes: IntegranteData[] }) {
    const [mounted, setMounted] = useState(false)
    const [reportData, setReportData] = useState<InformeResponse | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [periodoLabel, setPeriodoLabel] = useState("")

    useEffect(() => {
        setMounted(true)
    }, [])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/20 shadow-2xl p-4 rounded-2xl min-w-[180px]">
                    <p className="text-xs font-bold text-emerald-400/70 border-b border-emerald-500/10 pb-2 mb-3 uppercase tracking-wider">{label}</p>
                    <div className="space-y-3">
                        {payload.map((entry: any, index: number) => (
                            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-sm font-medium text-slate-300">{entry.name}</span>
                                </div>
                                <span className="text-sm font-bold text-white">
                                    {formatCurrency(entry.value ?? 0)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
        return null
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setErrorMsg("")
        setReportData(null)
        setIsPending(true)

        const formData = new FormData(e.currentTarget)
        const inicio = formData.get("fechaInicio") as string
        const fin = formData.get("fechaFin") as string
        const cat = formData.get("categoria") as string
        const userId = formData.get("userId") as string

        const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
        setPeriodoLabel(`${fmtDate(inicio)} — ${fmtDate(fin)}`)

        try {
            const { generarInforme } = await import('./actions')
            const res = await generarInforme(formData)

            if (res.error) {
                setErrorMsg(res.error)
            } else if (res.data) {
                setReportData(res as unknown as InformeResponse)
            }
        } catch {
            setErrorMsg("Error al generar el informe.")
        } finally {
            setIsPending(false)
        }
    }

    // Default dates
    const initDate = new Date()
    const endDateStr = initDate.toISOString().split('T')[0]
    initDate.setMonth(initDate.getMonth() - 5)
    initDate.setDate(1)
    const startDateStr = initDate.toISOString().split('T')[0]

    return (
        <div className="space-y-8 pb-12">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-emerald-500" />
                        Informes Analíticos
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Monitorea el crecimiento y salud de tus finanzas.</p>
                </div>
                <Button 
                    onClick={() => window.print()} 
                    variant="outline" 
                    className="rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-300 transition-all shadow-sm"
                >
                    <Printer className="w-4 h-4 mr-2" />
                    Exportar PDF
                </Button>
            </div>

            <Card className="rounded-[24px] bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border-slate-200/60 dark:border-slate-800/60 shadow-xl p-2 print:hidden">
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> Inicio
                            </label>
                            <input
                                type="date"
                                name="fechaInicio"
                                required
                                defaultValue={startDateStr}
                                className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> Fin
                            </label>
                            <input
                                type="date"
                                name="fechaFin"
                                required
                                defaultValue={endDateStr}
                                className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" /> Categoría
                            </label>
                            <select
                                name="categoria"
                                defaultValue="todas"
                                className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none"
                            >
                                <option value="todas">Todas las categorías</option>
                                {categories.map((cat, i) => (
                                    <option key={i} value={cat.nombre}>{getCategoryWithEmoji(cat.nombre)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" /> Integrante
                            </label>
                            <select
                                name="userId"
                                defaultValue="todos"
                                className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none"
                            >
                                <option value="todos">Toda la Familia</option>
                                {integrantes.map(i => (
                                    <option key={i.id} value={i.id}>{i.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <Button type="submit" disabled={isPending} className="h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 font-bold transition-all">
                            {isPending ? "Analizando..." : "Generar Informe"}
                        </Button>
                    </form>
                    {errorMsg && <p className="text-xs text-rose-500 mt-4 font-bold">{errorMsg}</p>}
                </CardContent>
            </Card>

            {reportData && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="group rounded-[28px] bg-emerald-500 p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden transition-all hover:scale-[1.02]">
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-emerald-100 uppercase tracking-widest opacity-80">Total Ingresos</p>
                                <h3 className="text-3xl font-black mt-2">{formatCurrency(reportData.summary.totalIngresos)}</h3>
                                <div className="mt-4 flex items-center text-xs font-bold bg-white/20 w-fit px-2 py-1 rounded-full">
                                    <TrendingUp className="w-3 h-3 mr-1" /> Meta superada
                                </div>
                            </div>
                            <TrendingUp className="absolute -bottom-6 -right-6 h-32 w-32 text-white/10 rotate-12 group-hover:rotate-0 transition-transform" />
                        </div>

                        <div className="group rounded-[28px] bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden transition-all hover:scale-[1.02]">
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest opacity-80">Total Gastos</p>
                                <h3 className="text-3xl font-black mt-2 text-rose-400">{formatCurrency(reportData.summary.totalGastos)}</h3>
                                <div className="mt-4 flex items-center text-xs font-bold bg-white/10 w-fit px-2 py-1 rounded-full">
                                    <TrendingDown className="w-3 h-3 mr-1" /> Flujo constante
                                </div>
                            </div>
                            <TrendingDown className="absolute -bottom-6 -right-6 h-32 w-32 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform" />
                        </div>

                        <div className="group rounded-[28px] bg-white dark:bg-slate-800/80 p-6 shadow-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden transition-all hover:scale-[1.02]">
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest opacity-80">Balance Final</p>
                                <h3 className={`text-3xl font-black mt-2 ${reportData.summary.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                                    {formatCurrency(reportData.summary.balance)}
                                </h3>
                                <div className="mt-4 flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 w-fit px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                                    <ArrowRightLeft className="w-3 h-3 mr-1" /> Periodo Actual
                                </div>
                            </div>
                            <ArrowRightLeft className="absolute -bottom-6 -right-6 h-32 w-32 text-slate-500/5 rotate-45 group-hover:rotate-0 transition-transform" />
                        </div>
                    </div>

                    {/* Main Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Monthly Evolution */}
                        <Card className="lg:col-span-2 rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-lg overflow-hidden">
                            <CardHeader className="p-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                                            Evolución Financiera
                                        </CardTitle>
                                        <CardDescription className="text-xs uppercase font-bold text-slate-500 mt-1">Tendencia de flujo de caja libre</CardDescription>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-4">
                                        <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-slate-500 uppercase">Ingresos</span></div>
                                        <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-rose-500" /><span className="text-[10px] font-bold text-slate-500 uppercase">Gastos</span></div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="h-[400px] px-4 pb-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={reportData.data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorIng" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                        <XAxis 
                                            dataKey="mes" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
                                            tickMargin={15}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                                            tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorIng)" />
                                        <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorGas)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* User Comparison */}
                        <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-lg overflow-hidden">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                                    <Users className="w-5 h-5 text-emerald-500" />
                                    Por Integrante
                                </CardTitle>
                                <CardDescription className="text-xs uppercase font-bold text-slate-500">Distribución de gastos familiares</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px] p-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={reportData.userComparison} layout="vertical" margin={{ left: 20, right: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 800 }} width={80} />
                                        <Tooltip cursor={{fill: 'rgba(16,185,129,0.05)'}} content={<CustomTooltip />} />
                                        <Bar dataKey="total" name="Total Gastos" radius={[0, 8, 8, 0]} barSize={32}>
                                            {reportData.userComparison.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#334155'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                            <div className="px-8 pb-8">
                                <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10">
                                    <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <ChevronRight className="w-3.5 h-3.5" /> Insight de Grupo
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                        {reportData.userComparison[0]?.nombre} es quien registra más gastos este periodo.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Bottom Row - Detailed List */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="lg:col-span-3 rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/80 shadow-2xl overflow-hidden">
                            <CardHeader className="p-8 bg-slate-50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-black">Detalle por Categoría</CardTitle>
                                        <CardDescription className="text-sm font-bold text-emerald-600">Análisis granular orientado a ROI y optimização</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 font-bold text-xs">
                                        📅 {periodoLabel}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-950/40 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                                <th className="px-8 py-5">Categoría</th>
                                                <th className="px-6 py-5">Frecuencia</th>
                                                <th className="px-6 py-5">Impacto Visual</th>
                                                <th className="px-6 py-5 text-right">Total Acumulado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                            {reportData.categoryDetail.map((cat, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="size-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">
                                                                {getCategoryWithEmoji(cat.nombre).split(' ')[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-800 dark:text-slate-200">{cat.nombre}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {idx + 101}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-black text-slate-500">
                                                            {cat.count} Ops
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 min-w-[200px]">
                                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-emerald-500 transition-all duration-1000" 
                                                                style={{ width: `${cat.porcentaje}%` }} 
                                                            />
                                                        </div>
                                                        <p className="text-[10px] font-black mt-2 text-slate-400">{cat.porcentaje.toFixed(1)}% del total</p>
                                                    </td>
                                                    <td className="px-8 py-5 text-right font-black text-slate-900 dark:text-white">
                                                        {formatCurrency(cat.total)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* PRINT ONLY: Summary Table */}
                    <div className="hidden print:block mt-20 border-t-4 border-emerald-500 pt-8">
                        <h2 className="text-2xl font-black mb-6">Resumen de Cuentas — Exportación Oficial</h2>
                        <div className="grid grid-cols-2 gap-8 mb-12">
                            <div className="p-6 bg-slate-50 rounded-3xl">
                                <p className="text-xs font-bold uppercase text-slate-500">Saldo del Período</p>
                                <p className="text-3xl font-black mt-2">{formatCurrency(reportData.summary.balance)}</p>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-3xl">
                                <p className="text-xs font-bold uppercase text-slate-500">Días Analizados</p>
                                <p className="text-3xl font-black mt-2">180 días</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center mt-20 italic">Informe generado por Finanzas-APP Premium. Todos los direitos reservados.</p>
                    </div>

                </div>
            )}
        </div>
    )
}
