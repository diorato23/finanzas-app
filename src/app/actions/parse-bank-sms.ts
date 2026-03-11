'use server'

import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// O schema ajustado para a realidade do Peso Colombiano (COP)
const transactionSchema = z.object({
  amount: z.number().describe('O valor exato da transação. Remova o símbolo $ e os pontos de separação de milhar. Exemplo: se o texto diz "$ 15.000", retorne 15000.'),
  type: z.enum(['income', 'expense']).describe('Se é uma entrada (income) ou saída (expense).'),
  description: z.string().describe('Nome limpo e comercial do estabelecimento ou pessoa. Remova códigos inúteis do banco.'),
  date: z.string().describe('Data no formato YYYY-MM-DD. Se o SMS disser "hoy", use a data de hoje.'),
  suggestedCategory: z.string().describe('A categoria que melhor se encaixa na descrição.'),
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
