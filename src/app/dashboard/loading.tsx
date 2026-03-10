import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="flex flex-col gap-8 p-4 sm:p-8">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-[150px] sm:w-[250px]" />
                <Skeleton className="h-10 w-[100px] sm:w-[120px] rounded-full" />
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6 border rounded-[20px] space-y-3 bg-card/50">
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-8 w-[140px]" />
                        <Skeleton className="h-4 w-[110px]" />
                    </div>
                ))}
            </div>

            {/* Grid de Movimientos e Acesso Rápido */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Skeleton da Lista (Ocupa 2 colunas) */}
                <div className="lg:col-span-2 p-6 border rounded-[20px] space-y-4 bg-card/50">
                    <Skeleton className="h-6 w-[180px]" />
                    <Skeleton className="h-[40px] w-full rounded-xl" />
                </div>

                {/* Skeleton de Acceso Rápido */}
                <div className="p-6 border rounded-[20px] space-y-4 bg-card/50">
                    <Skeleton className="h-6 w-[130px]" />
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
