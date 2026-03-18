'use server'

import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// El schema ajustado para la realidad del Peso Colombiano (COP)
const transactionSchema = z.object({
  amount: z.number().describe('El valor exacto de la transacción. Elimina el símbolo $ y los puntos de separación de miles. Ejemplo: si el texto dice "$ 15.000", retorna 15000.'),
  type: z.enum(['income', 'expense']).describe('Si es una entrada (income) o salida (expense).'),
  description: z.string().describe('Nombre limpio y comercial del establecimiento o persona. Elimina códigos inútiles del banco.'),
  date: z.string().describe('Fecha en formato YYYY-MM-DD. Si el SMS dice "hoy", usa la fecha de hoy.'),
  suggestedCategory: z.string().describe('La categoría que mejor encaja con la descripción.'),
});

export async function parseTransactionText(rawText: string, availableCategories: string[]) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return { success: false, error: "Falta configurar la API Key de Google (GOOGLE_GENERATIVE_AI_API_KEY) en las variables de entorno." };
  }

  try {
    const { object } = await generateObject({
      model: google('gemini-1.5-flash'), // Excelente para este parsing rápido
      schema: transactionSchema,
      system: `Eres un extractor de datos financieros especializado en el sistema bancario de Colombia.
               El usuario enviará textos copiados de notificaciones push o SMS de apps como Nequi, Daviplata, Bancolombia App, Lulo Bank, o recibos de PSE y Transfiya.
               
               REGLAS DE NEGOCIO Y JERGA COLOMBIANA:
               1. **Valores (COP):** Ignorar el separador de miles. "$ 50.000" debe convertirse en el número 50000.
               2. **Gastos (expense):** Busca términos como "Compra por", "Pagaste", "Transferencia a", "Pago PSE", "Retiro", "Te descontamos", "Retiraste".
               3. **Ingresos (income):** Busca términos como "Te enviaron plata", "Recibiste", "Transferencia de", "Recarga", "Abono a tu cuenta".
               4. **Limpieza de Descripción:** - Si es "Compra Aprobada PSE*MERCADOLIBRE BOGOTA", retorna solo "Mercado Libre".
                  - Si es "Transferencia exitosa a Nequi de JUAN PEREZ", retorna "Juan Perez (Nequi)".
                  - Si es un retiro como "Retiraste $170,000 en nuestro corresponsal BARRIO LA ESTANCIA", retorna "Retiro (Corresponsal Barrio La Estancia)".
               5. Las categorías permitidas en la base de datos del usuario son ÚNICAMENTE estas: ${availableCategories.join(', ')}. Sugiere la más precisa.`,
      prompt: `Extrae los datos financieros de esta notificación bancaria colombiana: "${rawText}"`,
    });

    return { success: true, data: object };
  } catch (error: unknown) {
    console.error("Error al analizar notificación:", error);
    // Mostrar el error real de la IA si es posible
    if (error instanceof Error) {
      console.error("Detalles del error IA:", error.message);
    }
    return { success: false, error: "No pude entender el formato o hubo un error con la IA. Comunícate con soporte o llena los datos manualmente." };
  }
}
