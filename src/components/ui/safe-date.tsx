"use client";

import { ReactNode, useSyncExternalStore } from "react";

interface SafeDateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component to prevent hydration mismatch when rendering dates or locale-specific text.
 * It renders the fallback (or null) on the server and only renders the actual children 
 * after the component has mounted on the client.
 */
export function SafeDate({ children, fallback = null }: SafeDateProps) {
  const isMounted = useSyncExternalStore(
    () => () => {
      // no-op
    },
    () => true,
    () => false
  );

  if (!isMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
