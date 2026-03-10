'use server'

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

/**
 * IA Categorizadora de Elite
 * Recebe uma descrição e uma lista de nomes de categorias existentes.
 * Retorna o nome da categoria mais provável.
 */
export async function suggestCategory(description: string, categories: string[]) {
    if (!description || description.length < 3) return null;

    try {
        const { text } = await generateText({
            model: google('gemini-1.5-flash'), // Performance balanceada para latência baixa na VPS
            system: `Você é um assistente financeiro especializado em categorização de gastos para um App de Finanças Pessoal.
               Suas opções de categorias são estritamente estas: ${categories.join(', ')}.
               Regras:
               1. Responda APENAS com o nome exato da categoria.
               2. Não use pontuação, explicações ou frases adicionais.
               3. Se houver ambiguidade, escolha a mais óbvia.
               4. Se não encontrar nenhuma relação, responda "Outros" ou a categoria equivalente na lista.`,
            prompt: `Em qual categoria se encaixa o gasto: "${description}"?`,
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
