import { Suspense } from "react"
import { PlusIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SummaryCardsWrapper } from "@/components/dashboard/summary-cards-wrapper"
import { RecentMovementsWrapper } from "@/components/dashboard/recent-movements-wrapper"
import { MetricsChartWrapper } from "@/components/dashboard/metrics-chart-wrapper"
import { BiometricActivation } from "@/components/auth/biometric-activation"
import { Skeleton } from "@/components/ui/skeleton"
import { SafeDate } from "@/components/ui/safe-date"

function SummaryCardsSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-[24px]" />
            ))}
        </div>
    )
}

function RecentMovementsSkeleton() {
    return (
        <Skeleton className="col-span-1 lg:col-span-2 h-[200px] w-full rounded-[24px]" />
    )
}

export default async function DashboardPage() {
    const now = new Date()

    return (
        <div className="space-y-8 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Resumen Financiero
                    </h2>
                    <SafeDate>
                        <p className="text-sm font-medium text-muted-foreground mt-1">
                            Mes actual: {now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                        </p>
                    </SafeDate>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95">
                        <Link href="/dashboard/transacciones/nueva">
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Nueva Transacción
                        </Link>
                    </Button>
                </div>
            </div>

            <BiometricActivation />

            {/* DASHBOARD STREAMING SECTION */}
            <Suspense fallback={<SummaryCardsSkeleton />}>
                <SummaryCardsWrapper />
            </Suspense>

            <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-[24px]" />}>
                <MetricsChartWrapper />
            </Suspense>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Suspense fallback={<RecentMovementsSkeleton />}>
                    <RecentMovementsWrapper />
                </Suspense>

                <Card className="rounded-[20px] shadow-sm border-border/50 bg-card/30 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Acceso Rápido</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start rounded-xl h-12 border-border/50 hover:bg-primary/5 hover:text-primary transition-all group" asChild>
                            <Link href="/dashboard/transacciones/nueva">
                                <PlusIcon className="w-4 h-4 mr-2 text-primary group-hover:scale-110 transition-transform" />
                                <span className="font-medium text-foreground">Agregar Ingreso</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start rounded-xl h-12 border-border/50 hover:bg-rose-500/5 hover:text-rose-500 transition-all group" asChild>
                            <Link href="/dashboard/transacciones/nueva">
                                <PlusIcon className="w-4 h-4 mr-2 text-rose-500 group-hover:scale-110 transition-transform" />
                                <span className="font-medium text-foreground">Agregar Gasto</span>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
