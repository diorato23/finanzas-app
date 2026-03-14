import { NextRequest, NextResponse } from "next/server";
import { authenticateWebhook, parseBody } from "../lib/auth";

export async function POST(req: NextRequest) {
    try {
        const body = await parseBody(req);
        
        // Use a mesma autenticação do webhook que já bloqueia trials expirados
        const auth = await authenticateWebhook(req, body);

        if (!auth.ok) {
            // Se falhou por conta do trial no auth.ts, ele retorna 200 pro n8n
            // com a message de bloqueio e success: true
            return auth.response;
        }

        // Se passar, significa que o trial está ativo ou é conta paga
        return NextResponse.json({
            success: true,
            allowed: true,
            message: "Acceso permitido"
        });

    } catch (error) {
        console.error("Error en check-trial:", error);
        return NextResponse.json(
            { error: "Error interno del servidor", details: error instanceof Error ? error.message : "Desconocido" },
            { status: 500 }
        );
    }
}
