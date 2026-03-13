'use server'

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

/**
 * IA Categorizadora de Elite
 * Recebe uma descrição e uma lista de nomes de categorias existentes.
 * Retorna o nome da categoria mais provável.
 */
export async function suggestCategory(description: string, categories: string[]) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        console.warn("Falta configurar GOOGLE_GENERATIVE_AI_API_KEY para suggerir categoría.");
        return null;
    }

    if (!description || description.length < 3) return null;

    try {
        const { text } = await generateText({
            model: google('gemini-1.5-flash'), // Performance balanceada para latência baixa na VPS
            system: `Eres un asistente financiero especializado en categorización de gastos para un App de Finanzas Personal.
               Tus opciones de categorías son estrictamente estas: ${categories.join(', ')}.
               Reglas:
               1. Responde ÚNICAMENTE con el nombre exacto de la categoría.
               2. No uses puntuación, explicaciones o frases adicionales.
               3. Si hay ambigüedad, elige la más obvia.
               4. Si no encuentras ninguna relación, responde "Otros" o la categoría equivalente en la lista.`,
            prompt: `¿En qué categoría encaja el gasto: "${description}"?`,
        });

        const suggestion = text.trim();
        // Validar se a resposta da IA está realmente na lista enviada
        if (categories.some(cat => cat.toLowerCase() === suggestion.toLowerCase())) {
            return suggestion;
        }

        return null;
    } catch (error) {
        console.error(">>> [IA ERROR]:", error);
        return null;
    }
}
