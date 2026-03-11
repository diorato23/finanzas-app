import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({ onAction, actionHref }: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
        <Receipt className="w-8 h-8 text-zinc-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        ¡Aún no hay movimientos!
      </h3>
      <p className="mb-6 text-sm text-muted-foreground max-w-[250px]">
        Registra tu primer ingreso o gasto para empezar a tomar el control de tu plata.
      </p>
      {actionHref ? (
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href={actionHref}>Registrar mi primer movimiento</Link>
        </Button>
      ) : (
        <Button onClick={onAction} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          Registrar mi primer movimiento
        </Button>
      )}
    </div>
  );

  return content;
}
