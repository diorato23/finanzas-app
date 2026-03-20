'use server'

/**
 * Botón Mágico — Parser de SMS bancarios colombianos (sin IA, solo regex)
 * Bancos soportados: Nequi, Daviplata, Bancolombia, Lulo Bank, PSE, genérico
 */

export interface ParsedTransaction {
  amount: number
  type: 'income' | 'expense'
  description: string
  suggestedCategory: string
}

/** Limpia el valor monetario colombiano y retorna un número */
function parseAmount(raw: string): number {
  // Soporta: "$ 18.500", "$18500", "18,500", "18.500", "$170,000"
  const cleaned = raw.replace(/[$\s]/g, '').replace(/\./g, '').replace(/,/g, '')
  return parseInt(cleaned, 10) || 0
}

/** Sugiere categoría basado en palabras clave del establecimiento */
function suggestCategory(description: string, availableCategories: string[]): string {
  const lower = description.toLowerCase()

  const keywordMap: Record<string, string[]> = {
    'Alimentación':   ['rappi', 'domicilios', 'mercado', 'éxito', 'exito', 'jumbo', 'carulla', 'oma', 'subway', 'mcdonald', 'kfc', 'pizza', 'restaurante', 'comida', 'supermercado', 'tienda', 'panaderia', 'café', 'cafe'],
    'Transporte':     ['uber', 'cabify', 'beat', 'taxi', 'gasolina', 'combustible', 'parking', 'parqueadero', 'peaje', 'transmilenio', 'sitp'],
    'Vivienda':       ['arriendo', 'alquiler', 'servicios', 'agua', 'luz', 'gas', 'internet', 'claro', 'movistar', 'tigo', 'etb'],
    'Salud':          ['farmacia', 'droguería', 'drogueria', 'clínica', 'clinica', 'hospital', 'médico', 'medico', 'consultorio', 'copago'],
    'Suscripciones':  ['netflix', 'spotify', 'youtube', 'amazon', 'disney', 'hbo', 'prime', 'apple', 'icloud', 'google one'],
    'Ingresos':       ['salario', 'nomina', 'nómina', 'pago sueldo', 'transferencia recibida', 'te enviaron', 'recibiste'],
  }

  for (const [category, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(kw => lower.includes(kw))) {
      // Solo retorna si la categoría está disponible para este usuario
      if (availableCategories.includes(category)) return category
    }
  }

  return availableCategories.includes('Otros') ? 'Otros' : availableCategories[0] || 'Otros'
}

/** Limpia el nombre del establecimiento */
function cleanDescription(raw: string): string {
  return raw
    .replace(/PSE\*/gi, '')           // Quita prefijo PSE*
    .replace(/\s{2,}/g, ' ')          // Colapsa espacios múltiples
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) // Title Case
    .join(' ')
}

// ─── PATRONES POR BANCO ────────────────────────────────────────────────────

const PATTERNS: Array<{
  bank: string
  regex: RegExp
  extract: (m: RegExpMatchArray) => { amount: number; type: 'income' | 'expense'; description: string }
}> = [
  // NEQUI — gastos: "¡Listo! Pagaste $ 18.500 en RAPPI S.A.S con tu Tarjeta Nequi"
  {
    bank: 'Nequi',
    regex: /pagaste\s*\$?\s*([\d.,]+)\s+en\s+([A-ZÁÉÍÓÚÑa-záéíóúñ0-9 .,'*&-]+?)(?:\s+con|\s+desde|$)/i,
    extract: (m) => ({ amount: parseAmount(m[1]), type: 'expense', description: cleanDescription(m[2]) }),
  },
  // NEQUI — ingresos: "Te enviaron $50.000 de Juan Carlos Lopez"
  {
    bank: 'Nequi',
    regex: /te enviaron\s*\$?\s*([\d.,]+)\s+de\s+([A-ZÁÉÍÓÚÑa-záéíóúñ ]+)/i,
    extract: (m) => ({ amount: parseAmount(m[1]), type: 'income', description: `${cleanDescription(m[2])} (Nequi)` }),
  },
  // NEQUI — "Retiraste $170,000 en nuestro corresponsal BARRIO LA ESTANCIA"
  {
    bank: 'Nequi',
    regex: /retiraste\s*\$?\s*([\d.,]+)\s+en\s+(?:nuestro\s+corresponsal\s+)?([A-ZÁÉÍÓÚÑa-záéíóúñ0-9 ]+)/i,
    extract: (m) => ({ amount: parseAmount(m[1]), type: 'expense', description: `Retiro Corresponsal ${cleanDescription(m[2])}` }),
  },
  // DAVIPLATA — "Transferencia de $120.000 a Pedro Lopez fue exitosa"
  {
    bank: 'Daviplata',
    regex: /transferencia de\s*\$?\s*([\d.,]+)\s+a\s+([A-ZÁÉÍÓÚÑa-záéíóúñ ]+?)(?:\s+fue|\s+por|$)/i,
    extract: (m) => ({ amount: parseAmount(m[1]), type: 'expense', description: `${cleanDescription(m[2])} (Daviplata)` }),
  },
  // DAVIPLATA — "Recibiste $80.000 de Maria Garcia"
  {
    bank: 'Daviplata',
    regex: /recibiste\s*\$?\s*([\d.,]+)\s+de\s+([A-ZÁÉÍÓÚÑa-záéíóúñ ]+)/i,
    extract: (m) => ({ amount: parseAmount(m[1]), type: 'income', description: `${cleanDescription(m[2])} (Daviplata)` }),
  },
  // BANCOLOMBIA — "Compra aprobada por $35,000 en ÉXITO BOGOTÁ"
  {
    bank: 'Bancolombia',
    regex: /compra aprobada por\s*\$?\s*([\d.,]+)\s+en\s+([A-ZÁÉÍÓÚÑa-záéíóúñ0-9 .,'*&-]+?)(?:\s+Tu|\s+Saldo|$)/i,
    extract: (m) => ({ amount: parseAmount(m[1]), type: 'expense', description: cleanDescription(m[2]) }),
  },
  // BANCOLOMBIA — "Transferencia desde cuenta a Juan Perez por $200.000"
  {
    bank: 'Bancolombia',
    regex: /transferencia.*?a\s+([A-ZÁÉÍÓÚÑa-záéíóúñ ]+?)\s+por\s*\$?\s*([\d.,]+)/i,
    extract: (m) => ({ amount: parseAmount(m[2]), type: 'expense', description: `${cleanDescription(m[1])} (Bancolombia)` }),
  },
  // LULO BANK — "Lulo Bank: Pagaste $12.000 en Rappi"
  {
    bank: 'Lulo Bank',
    regex: /lulo bank[:\s]+pagaste\s*\$?\s*([\d.,]+)\s+en\s+([A-ZÁÉÍÓÚÑa-záéíóúñ0-9 .]+)/i,
    extract: (m) => ({ amount: parseAmount(m[1]), type: 'expense', description: cleanDescription(m[2]) }),
  },
  // PSE — "Pago PSE aprobado $95.000 — Netflix"
  {
    bank: 'PSE',
    regex: /pago pse.*?\$?\s*([\d.,]+)[^A-Za-z]*(?:—|-|a|en)?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ0-9 .]+)/i,
    extract: (m) => ({ amount: parseAmount(m[1]), type: 'expense', description: cleanDescription(m[2]) }),
  },
  // GENÉRICO — extrae cualquier monto con "$ 99.999" o "$99999" y el texto que lo rodea
  {
    bank: 'Genérico',
    regex: /\$\s*([\d.,]+)/,
    extract: (m) => ({ amount: parseAmount(m[1]), type: 'expense', description: 'Transacción' }),
  },
]

// ─── FUNCIÓN PRINCIPAL ─────────────────────────────────────────────────────

export async function parseTransactionText(
  rawText: string,
  availableCategories: string[]
): Promise<{ success: boolean; data?: ParsedTransaction; error?: string }> {
  const text = rawText.trim()

  if (!text) {
    return { success: false, error: 'El campo está vacío.' }
  }

  for (const pattern of PATTERNS) {
    const match = text.match(pattern.regex)
    if (match) {
      try {
        const extracted = pattern.extract(match)

        if (!extracted.amount || extracted.amount <= 0) continue

        const category = suggestCategory(
          extracted.description + ' ' + text,
          availableCategories
        )

        return {
          success: true,
          data: {
            amount: extracted.amount,
            type: extracted.type,
            description: extracted.description || 'Transacción',
            suggestedCategory: category,
          },
        }
      } catch {
        continue
      }
    }
  }

  return {
    success: false,
    error: '⚠️ No reconocí el formato de este SMS. ¿Es de Nequi, Daviplata o Bancolombia? Puedes llenar los datos manualmente.',
  }
}
