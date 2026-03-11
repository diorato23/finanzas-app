import { NextRequest, NextResponse } from "next/server";
import { authenticateWebhook, parseBody } from "../lib/auth";

export const dynamic = "force-dynamic";

/**
 * Legacy endpoint — redirects to /api/webhook/transacciones
 * Kept for backward compatibility with existing n8n workflows
 */
export async function POST(req: NextRequest) {
    try {
        const body = await parseBody(req);
        const auth = await authenticateWebhook(req, body);

        if (!auth.ok) return auth.response;

        const { supabase, perfil } = auth;

        const descripcion = String(body.descripcion || "").trim();
        const monto = Number(body.monto) || 0;
        const tipo = String(body.tipo || "pago").trim();
        const categoria = String(body.categoria || "Otros").trim();
        const fecha_vencimiento = body.fecha_vencimiento ? String(body.fecha_vencimiento) : null;

        if (!descripcion || !monto) {
            return NextResponse.json(
                { error: "Campos 'descripcion' y 'monto' son obligatorios" },
                { status: 400 }
            );
        }

        const { error } = await supabase.from("transacciones").insert({
            descripcion,
            monto,
            tipo,
            categoria,
            estado: "pendiente",
            user_id: perfil.id,
            familia_id: perfil.familia_id,
            fecha_vencimiento
        });

        if (error) {
            return NextResponse.json({ error: "Error al crear", detalle: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "¡Transacción registrada exitosamente!"
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Error desconocido";
        return NextResponse.json({ error: "Error interno", detalle: msg }, { status: 500 });
    }
}
