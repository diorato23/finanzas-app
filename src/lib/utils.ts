import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatador para Peso Colombiano (COP)
export function formatCOP(amount: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const categoryEmojis: Record<string, string> = {
  "Alimentación": "🍔",
  "Vivienda": "🏠",
  "Suscripciones": "📱",
  "Transporte": "🚗",
  "Salud": "⚕️",
  "Ingresos": "💰",
  "Otros": "📦",
  "Entretenimiento": "🎬",
  "Educación": "📚",
  "Ropa": "👗",
  "Viajes": "✈️",
  "Mascotas": "🐾",
  "Regalos": "🎁",
}

export function getCategoryEmoji(category: string): string {
  if (!category) return "🏷️"

  // Try exact match
  if (categoryEmojis[category]) return categoryEmojis[category]

  // Try case-insensitive matching
  const lowerCat = category.toLowerCase()
  for (const [key, emoji] of Object.entries(categoryEmojis)) {
    if (key.toLowerCase() === lowerCat) return emoji
  }

  // Fallback for missing ones, trying to infer from keywords
  if (lowerCat.includes("comida") || lowerCat.includes("restaurante")) return "🍔"
  if (lowerCat.includes("casa") || lowerCat.includes("hogar")) return "🏠"
  if (lowerCat.includes("auto") || lowerCat.includes("coche") || lowerCat.includes("gasolina")) return "🚗"
  if (lowerCat.includes("salario") || lowerCat.includes("sueldo") || lowerCat.includes("pago")) return "💵"

  // Default fallback
  return "📌"
}

export function getCategoryWithEmoji(category: string): string {
  if (!category) return category
  const emoji = getCategoryEmoji(category)
  return `${emoji} ${category}`
}
