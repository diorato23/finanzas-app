"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from 'next/dynamic'
import { TrendingUp, TrendingDown, ArrowRightLeft, Printer, FileText } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

// Carregamento dinâmico para reduzir bundle size inicial
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false })

import { getCategoryWithEmoji } from "@/lib/utils"

type InformeData = {
    mes: string
    ingresos: number
    gastos: number
}

type TooltipEntry = {
    color?: string
    name?: string
    value?: number
}

type TooltipProps = {
    active?: boolean
    payload?: TooltipEntry[]
    label?: string
}
export type CategoriaData = {
    nombre: string
}

export function InformeClient({ categories }: { categories: CategoriaData[] }) {
    const [mounted, setMounted] = useState(false)
    const [chartData, setChartData] = useState<InformeData[] | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")

    useEffect(() => {
        setMounted(true)
    }, [])

    const handlePrint = () => {
        window.print()
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card/95 backdrop-blur-sm border border-border/50 shadow-xl p-3 rounded-xl min-w-[150px]">
                    <p className="text-xs font-semibold text-muted-foreground mb-3">{label}</p>
                    <div className="space-y-2">
                        {payload.map((entry: TooltipEntry, index: number) => (
                            <div key={`item-${index}`} className="flex items-center gap-2">
                                <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-sm font-medium text-foreground flex-1">
                                    {entry.name}
                                </span>
                                <span className="text-sm font-bold" style={{ color: entry.color }}>
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
        setChartData(null)
        setIsPending(true)

        try {
            const formData = new FormData(e.currentTarget)
            const { generarInforme } = await import('./actions')
            const res = await generarInforme(formData)

            if (res.error) {
                setErrorMsg(res.error)
            } else if (res.data) {
                setChartData(res.data)
            }
        } catch (err) {
            setErrorMsg("Error al generar el informe.")
        } finally {
            setIsPending(false)
        }
    }

    // Default dates for the form (last 6 months to today)
    const initDate = new Date()
    const endDateStr = initDate.toISOString().split('T')[0]
    initDate.setMonth(initDate.getMonth() - 5)
    initDate.setDate(1)
    const startDateStr = initDate.toISOString().split('T')[0]

    return (
        <div className="space-y-6">
            <Card className="rounded-[20px] bg-card border-border/60 shadow-md p-2 print:hidden">
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold tracking-wider text-muted-foreground uppercase">Período del Informe</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-2 w-full md:w-auto flex-1">
                            <label htmlFor="fechaInicio" className="text-sm font-medium text-foreground">Fecha Inicio</label>
                            <input
                                type="date"
                                id="fechaInicio"
                                name="fechaInicio"
                                required
                                defaultValue={startDateStr}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-2 w-full md:w-auto flex-1">
                            <label htmlFor="fechaFin" className="text-sm font-medium text-foreground">Fecha Fin</label>
                            <input
                                type="date"
                                id="fechaFin"
                                name="fechaFin"
                                required
                                defaultValue={endDateStr}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-2 w-full md:w-auto flex-1">
                            <label htmlFor="categoria" className="text-sm font-medium text-foreground">Categoría</label>
                            <select
                                id="categoria"
                                name="categoria"
                                defaultValue="todas"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="todas">Todas</option>
                                {categories && categories.length > 0 && categories.map((cat, i) => (
                                    <option key={i} value={cat.nombre}>{getCategoryWithEmoji(cat.nombre)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2 w-full md:w-auto flex-[0.5]">
                            <label htmlFor="agruparPor" className="text-sm font-medium text-foreground">Agrupar por</label>
                            <select
                                id="agruparPor"
                                name="agruparPor"
                                defaultValue="mes"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="mes">Mes</option>
                                <option value="semana">Semana</option>
                                <option value="categoria">Categoría</option>
                            </select>
                        </div>
                        <div className="w-full md:w-auto">
                            <Button type="submit" disabled={isPending} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 px-6">
                                {isPending ? "Generando..." : (
                                    <>
                                        <FileText className="w-4 h-4 mr-2" />
                                        Generar
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                    {errorMsg && <p className="text-sm text-destructive mt-4 font-medium">{errorMsg}</p>}
                </CardContent>
            </Card>

            {chartData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
                        {(() => {
                            const totalIngresos = chartData.reduce((acc, curr) => acc + curr.ingresos, 0)
                            const totalGastos = chartData.reduce((acc, curr) => acc + curr.gastos, 0)
                            return (
                                <>
                                    <Card className="rounded-[20px] bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 overflow-hidden relative">
                                        <CardHeader className="pb-2">
                                            <CardDescription className="font-medium text-emerald-600 dark:text-emerald-400">Total Ingresos</CardDescription>
                                            <CardTitle className="text-3xl text-emerald-700 dark:text-emerald-300">
                                                {formatCurrency(totalIngresos)}
                                            </CardTitle>
                                        </CardHeader>
                                        <TrendingUp className="w-24 h-24 text-emerald-500/10 absolute -bottom-4 -right-4" />
                                    </Card>

                                    <Card className="rounded-[20px] bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 overflow-hidden relative">
                                        <CardHeader className="pb-2">
                                            <CardDescription className="font-medium text-rose-600 dark:text-rose-400">Total Gastos</CardDescription>
                                            <CardTitle className="text-3xl text-rose-700 dark:text-emerald-300">
                                                {formatCurrency(totalGastos)}
                                            </CardTitle>
                                        </CardHeader>
                                        <TrendingDown className="w-24 h-24 text-rose-500/10 absolute -bottom-4 -right-4" />
                                    </Card>

                                    <Card className="rounded-[20px] border-border/50 shadow-sm overflow-hidden relative">
                                        <CardHeader className="pb-2">
                                            <CardDescription className="font-medium">Balance General</CardDescription>
                                            <CardTitle className={`text-3xl ${totalIngresos - totalGastos >= 0 ? "text-primary" : "text-rose-500"}`}>
                                                {formatCurrency(totalIngresos - totalGastos)}
                                            </CardTitle>
                                        </CardHeader>
                                        <ArrowRightLeft className="w-24 h-24 text-muted-foreground/10 absolute -bottom-4 -right-4" />
                                    </Card>
                                </>
                            )
                        })()}
                    </div>

                    <Card className="rounded-[20px] shadow-sm border-border/50 bg-card print:border-none print:shadow-none">
                        <CardHeader className="pb-6">
                            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                                <div>
                                    <CardTitle className="text-xl font-bold">Evolución de Ingresos y Gastos</CardTitle>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="print:hidden rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                                    onClick={handlePrint}
                                >
                                    <Printer className="w-4 h-4 mr-2" />
                                    Exportar Informe PDF
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="px-2 sm:px-6">
                            <div className="w-full overflow-x-auto overflow-y-hidden pb-4">
                                <div className="min-w-[500px] h-[350px] sm:h-[400px] w-full mt-4">
                                    {!mounted ? (
                                        <div className="h-full w-full flex items-center justify-center">
                                            <span className="text-muted-foreground animate-pulse text-sm">Cargando Gráficos...</span>
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%" minWidth={500} minHeight={350}>
                                            <LineChart
                                                data={chartData}
                                                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="4 4" vertical={false} strokeOpacity={0.4} className="stroke-muted-foreground" />
                                                <XAxis
                                                    dataKey="mes"
                                                    className="text-[13px] text-muted-foreground font-medium"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickMargin={12}
                                                    padding={{ left: 10, right: 10 }}
                                                />
                                                <YAxis
                                                    tickFormatter={(val) => val >= 1000000 ? `$${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`}
                                                    className="text-[13px] text-muted-foreground font-medium"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickMargin={12}
                                                />
                                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                                                <Legend
                                                    wrapperStyle={{ paddingTop: '20px' }}
                                                    iconType="circle"
                                                    iconSize={8}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="ingresos"
                                                    name="Ingresos"
                                                    stroke="#4f46e5" /* Indigo 600 - Match Reference 1 */
                                                    strokeWidth={3}
                                                    dot={{ r: 4, strokeWidth: 3, fill: 'var(--card)', stroke: '#4f46e5' }}
                                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                                                    animationDuration={1500}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="gastos"
                                                    name="Gastos"
                                                    stroke="#8b5cf6" /* Violet 500 - Match Reference 2 */
                                                    strokeWidth={3}
                                                    dot={{ r: 4, strokeWidth: 3, fill: 'var(--card)', stroke: '#8b5cf6' }}
                                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }}
                                                    animationDuration={1500}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
