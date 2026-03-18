"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface AnimatedBalanceProps {
  value: number;
  className?: string;
}

export function AnimatedBalance({ value, className }: AnimatedBalanceProps) {
  // Configuração da mola (spring) para uma animação fluida. 
  // duration: 1500ms (1.5s) é o "sweet spot" para não ser nem muito lento nem muito rápido.
  const spring = useSpring(0, { bounce: 0, duration: 1500 });
  
  // Transforma o número bruto no formato de Peso Colombiano (COP) em tempo real
  const display = useTransform(spring, (current) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Math.abs(Math.round(current)))
  );

  // Sempre que o valor real mudar (ex: o Supabase devolver o saldo atualizado), a animação dispara
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}
