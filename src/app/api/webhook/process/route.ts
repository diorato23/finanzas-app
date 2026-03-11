import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createTransaccionInternal } from "@/app/dashboard/transacciones/actions";

export const dynamic = "force-dynamic";

// Detects body format automatically: works with JSON and form-encoded (n8n keypair mode)
async function parseBody(req: NextRequest): Promise<Record<string, unknown>> {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await req.text();
        const params = new URLSearchParams(text);
        return Object.fromEntries(params.entries());
    }
    return await req.json();
}

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization")?.trim() || "";

    // Strips accidental quotes or trailing spaces injected by Docker .env
    const rawSecret = process.env.N8N_WEBHOOK_SECRET;
    const cleanSecret = rawSecret?.replace(/['"]/g, "")?.trim();

    // 1. Validate Secret
    if (!cleanSecret || authHeader !== `Bearer ${cleanSecret}`) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const body = await parseBody(req);
        const { whatsapp, descripcion, monto, tipo, categoria, estado, fecha_vencimiento, comprobante_url } = body as Record<string, string>;

        if (!whatsapp || !descripcion || !monto) {
            return NextResponse.json(
                { error: "Faltan campos requeridos: whatsapp, descripcion y monto son obligatorios." },
                { status: 400 }
            );
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. Look up profile by WhatsApp number
        const { data: perfil, error: perfilError } = await supabase
            .from("perfiles")
            .select("id, familia_id")
            .eq("whatsapp", whatsapp)
            .single();

        if (perfilError || !perfil) {
            return NextResponse.json({ error: "Usuario no encontrado para este número de WhatsApp" }, { status: 404 });
        }

        // 3. Create transaction
        const result = await createTransaccionInternal({
            descripcion,
            monto: Number(monto),
            tipo: tipo || "pago",
            categoria: categoria || "Otros",
            estado: estado || "pendiente",
            user_id: perfil.id,
            familia_id: perfil.familia_id,
            fecha_vencimiento: fecha_vencimiento || null,
            comprobante_url: comprobante_url || null
        });

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "¡Transacción registrada exitosamente!" });

    } catch (error) {
        console.error("Error en Webhook:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
