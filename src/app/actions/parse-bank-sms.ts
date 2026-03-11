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
  try {
    const { object } = await generateObject({
      model: google('gemini-1.5-flash'), // Excelente para este parsing rápido
      schema: transactionSchema,
      system: `Você é um extrator de dados financeiros especializado no sistema bancário da Colômbia.
               O usuário enviará textos copiados de notificações push ou SMS de apps como Nequi, Daviplata, Bancolombia App, Lulo Bank, ou recibos de PSE e Transfiya.
               
               REGRAS DE NEGÓCIO E JARGÕES COLOMBIANOS:
               1. **Valores (COP):** Ignorar o separador de milhares. "$ 50.000" deve virar o número 50000.
               2. **Despesas (expense):** Procure por termos como "Compra por", "Pagaste", "Transferencia a", "Pago PSE", "Retiro", "Te descontamos".
               3. **Receitas (income):** Procure por termos como "Te enviaron plata", "Recibiste", "Transferencia de", "Recarga", "Abono a tu cuenta".
               4. **Limpeza de Descrição:** - Se for "Compra Aprobada PSE*MERCADOLIBRE BOGOTA", retorne apenas "Mercado Libre".
                  - Se for "Transferencia exitosa a Nequi de JUAN PEREZ", retorne "Juan Perez (Nequi)".
               5. As categorias permitidas no banco de dados do usuário são APENAS estas: ${availableCategories.join(', ')}. Sugira a mais precisa.`,
      prompt: `Extraia os dados financeiros desta notificação bancária colombiana: "${rawText}"`,
    });

    return { success: true, data: object };
  } catch (error) {
    console.error("Erro ao analisar notificação:", error);
    return { success: false, error: "No pude entender el formato. Por favor, llena los datos manualmente." };
  }
}
