"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db-local";
import { syncOfflineTransactions } from "@/app/dashboard/transacciones/sync-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleSync = async () => {
      // Verifica se estamos online e se há transações pendentes
      if (!navigator.onLine) return;

      const pending = await db.pendingTransactions.toArray();
      if (pending.length === 0) return;

      setIsSyncing(true);
      
      try {
        const res = await syncOfflineTransactions(pending);
        
        if (res.success) {
          // Se sincronizou com sucesso, limpa o banco local
          await db.pendingTransactions.clear();
          toast.success(`¡Sincronizados ${res.count} ítems offline! 🔄`, {
            description: "Tus datos ahora están en la nube."
          });
          router.refresh();
        } else {
          console.error("Error en la sincronización:", res.error);
        }
      } catch (error) {
        console.error("Falla al sincronizar:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    // Tenta sincronizar ao montar o hook
    handleSync();

    // Ouve eventos de rede para sincronizar automaticamente ao recuperar sinal
    window.addEventListener("online", handleSync);
    
    return () => {
      window.removeEventListener("online", handleSync);
    };
  }, [router]);

  return { isSyncing };
}
