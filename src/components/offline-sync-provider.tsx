"use client";

import { useOfflineSync } from "@/hooks/use-offline-sync";
import { ReactNode } from "react";

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  // Chamamos o hook aqui para que ele rode globalmente no dashboard
  useOfflineSync();
  
  return <>{children}</>;
}
