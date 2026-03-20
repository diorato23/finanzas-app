'use server'

import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const transactionSchema = z.object({
  amount: z.number().describe('El valor exacto de la transacción. Elimina el símbolo $ y los puntos de separación de miles. Ejemplo: si el texto dice "$ 15.000", retorna 15000.'),
  type: z.enum(['income', 'expense']).describe('Si es una entrada (income) o salida (expense).'),
  description: z.string().describe('Nombre limpio y comercial del establecimiento o persona. Elimina códigos inútiles del banco.'),
  date: z.string().describe('Fecha en formato YYYY-MM-DD. Si el SMS dice "hoy", usa la fecha de hoy.'),
  suggestedCategory: z.string().describe('La categoría que mejor encaja con la descripción.'),
});

export async function parseTransactionText(rawText: string, availableCategories: string[]) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return { 
      success: false, 
      error: "API Key de Google no configurada en el servidor. Contacta al administrador." 
    };
  }

  try {
    const { object } = await generateObject({
      model: google('gemini-2.0-flash'), // gemini-2.0-flash: más rápido y preciso
      schema: transactionSchema,
      system: `Eres un extractor de datos financieros especializado en el sistema bancario de Colombia.
               El usuario enviará textos copiados de notificaciones push o SMS de apps como Nequi, Daviplata, Bancolombia App, Lulo Bank, o recibos de PSE y Transfiya.
               
               REGLAS DE NEGOCIO Y JERGA COLOMBIANA:
               1. **Valores (COP):** Ignorar el separador de miles. "$ 50.000" debe convertirse en el número 50000.
               2. **Gastos (expense):** Busca términos como "Compra por", "Pagaste", "Transferencia a", "Pago PSE", "Retiro", "Te descontamos", "Retiraste".
               3. **Ingresos (income):** Busca términos como "Te enviaron plata", "Recibiste", "Transferencia de", "Recarga", "Abono a tu cuenta".
               4. **Limpieza de Descripción:** 
                  - Si es "Compra Aprobada PSE*MERCADOLIBRE BOGOTA", retorna solo "Mercado Libre".
                  - Si es "Transferencia exitosa a Nequi de JUAN PEREZ", retorna "Juan Perez (Nequi)".
                  - Si es un retiro, retorna "Retiro (Corresponsal Nombre del lugar)".
               5. Las categorías disponibles son ÚNICAMENTE estas: ${availableCategories.join(', ')}. Elige la más precisa de esta lista exacta.`,
      prompt: `Extrae los datos financieros de esta notificación bancaria colombiana: "${rawText}"`,
    });

    return { success: true, data: object };

  } catch (error: unknown) {
    console.error("Error al analizar notificación:", error);

    const msg = error instanceof Error ? error.message : String(error);

    // Error específico de API key inválida
    if (msg.toLowerCase().includes('api_key') || msg.toLowerCase().includes('401') || msg.toLowerCase().includes('invalid')) {
      return { success: false, error: "API Key de Google inválida o sin permisos. Verifica la configuración." };
    }

    // Error de modelo no disponible
    if (msg.toLowerCase().includes('model') || msg.toLowerCase().includes('404')) {
      return { success: false, error: "Modelo de IA no disponible temporalmente. Intenta en unos minutos." };
    }

    return { success: false, error: "No pude interpretar el SMS. ¿El texto es de Nequi, Daviplata o Bancolombia?" };
  }
}
