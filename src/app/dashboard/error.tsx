"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aqui poderia integrar um serviço como o Sentry para monitorizar erros
    console.error("Erro capturado pelo Boundary:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <div className="p-4 mb-4 rounded-full bg-red-500/10">
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-foreground">Uy, perdimos la conexión</h2>
      <p className="mb-6 text-muted-foreground max-w-[300px]">
        No pudimos cargar tus datos en este momento. Verifica tu conexión a internet e intenta de nuevo.
      </p>
      <Button 
        variant="outline" 
        onClick={() => reset()} // Esta função tenta renderizar o componente de novo (refetch)
        className="border-border text-foreground hover:bg-accent"
      >
        Intentar de nuevo
      </Button>
    </div>
  );
}
