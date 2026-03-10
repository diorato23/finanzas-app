import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
    title: string;
    amount: number;
    icon: LucideIcon;
    variant?: "default" | "success" | "danger";
    description?: string;
}

export function SummaryCard({
    title,
    amount,
    icon: Icon,
    variant = "default",
    description,
}: SummaryCardProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    return (
        <Card className="overflow-hidden border-none bg-background/50 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn(
                    "p-2 rounded-xl",
                    variant === "success" && "bg-emerald-500/10 text-emerald-500",
                    variant === "danger" && "bg-rose-500/10 text-rose-500",
                    variant === "default" && "bg-blue-500/10 text-blue-500"
                )}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">
                    {formatCurrency(amount)}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {description}
                    </p>
                )}
                <div className={cn(
                    "mt-3 h-1 w-full rounded-full opacity-20",
                    variant === "success" && "bg-emerald-500",
                    variant === "danger" && "bg-rose-500",
                    variant === "default" && "bg-blue-500"
                )} />
            </CardContent>
        </Card>
    );
}
