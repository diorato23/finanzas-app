"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface MetricsChartProps {
    data: {
        date: string
        ingresos: number
        gastos: number
    }[]
}

export function MetricsChart({ data }: MetricsChartProps) {
    return (
        <Card className="col-span-1 lg:col-span-3 rounded-[24px] shadow-sm border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold tracking-tight">Flujo de Caja</CardTitle>
                    <CardDescription className="text-muted-foreground font-medium">
                        Comparativa de ingresos y gastos (últimos meses)
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-primary, #10b981)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--color-primary, #10b981)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="currentColor"
                                className="opacity-[0.05]"
                             />
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value.split(' ')[0]} // Solo el mes
                                dy={10}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value / 1000}k`}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-[12px] border border-border/50 bg-background/95 p-3 shadow-xl backdrop-blur-md">
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                                    {payload[0].payload.date}
                                                </p>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                        <span className="text-sm font-semibold">
                                                            Ingresos: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(payload[0].value as number)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-rose-500" />
                                                        <span className="text-sm font-semibold">
                                                            Gastos: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(payload[1].value as number)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="ingresos"
                                stroke="var(--color-primary, #10b981)"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorIngresos)"
                                animationDuration={1500}
                                stackId="1"
                            />
                            <Area
                                type="monotone"
                                dataKey="gastos"
                                stroke="#f43f5e"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorGastos)"
                                animationDuration={2000}
                                stackId="2"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
