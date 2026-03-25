import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
    title: string;
    amount: number;
    icon: LucideIcon;
    variant?: "default" | "success" | "danger";
    description?: string;
    href?: string;
}

import { AnimatedBalance } from "@/components/ui/animated-balance";
import Link from "next/link";

export function SummaryCard({
    title,
    amount,
    icon: Icon,
    variant = "default",
    description,
    href,
}: SummaryCardProps) {
    const cardContent = (
        <Card className={cn(
            "overflow-hidden border-none bg-background/50 backdrop-blur-md shadow-lg transition-all duration-300",
            href ? "hover:shadow-xl hover:scale-[1.02] cursor-pointer" : ""
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn(
                    "p-2 rounded-xl",
                    variant === "success" && "bg-emerald-500/10 text-emerald-500",
                    variant === "danger" && "bg-rose-500/10 text-rose-500",
                    variant === "default" && "bg-primary/10 text-primary"
                )}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">
                    <AnimatedBalance value={amount} />
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
                    variant === "default" && "bg-primary"
                )} />
            </CardContent>
        </Card>
    );

    if (href) {
        return (
            <Link href={href} className="block no-underline">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
}
