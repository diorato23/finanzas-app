import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const rawSecret = process.env.N8N_WEBHOOK_SECRET;
    const cleanSecret = rawSecret?.replace(/['"]/g, "")?.trim();

    if (!cleanSecret || authHeader !== `Bearer ${cleanSecret}`) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const body = await parseBody(req);
        const whatsapp = String(body.whatsapp || "").trim();
        const descripcion = String(body.descripcion || "").trim();
        const monto = Number(body.monto) || 0;
        const tipo = String(body.tipo || "pago").trim();
        const categoria = String(body.categoria || "Otros").trim();
        const fecha_vencimiento = body.fecha_vencimiento ? String(body.fecha_vencimiento) : null;

        if (!whatsapp || !descripcion || !monto) {
            return NextResponse.json({
                error: "Campos requeridos faltando",
                recibido: { whatsapp, descripcion, monto }
            }, { status: 400 });
        }

        // Create Supabase Admin client (bypasses RLS)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            return NextResponse.json({
                error: "Configuración del servidor incompleta",
                diagnostico: {
                    supabase_url: !!supabaseUrl,
                    service_key: !!serviceKey
                }
            }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, serviceKey);

        // 1. Buscar perfil por WhatsApp
        const { data: perfil, error: perfilError } = await supabase
            .from("perfiles")
            .select("id, familia_id")
            .eq("whatsapp", whatsapp)
            .single();

        if (perfilError || !perfil) {
            return NextResponse.json({
                error: "Usuario no encontrado",
                diagnostico: {
                    whatsapp_buscado: whatsapp,
                    supabase_error: perfilError?.message || "sin perfil",
                    supabase_code: perfilError?.code || "N/A"
                }
            }, { status: 404 });
        }

        // 2. Insertar transacción directamente (sin RLS)
        const { error: insertError } = await supabase
            .from("transacciones")
            .insert({
                descripcion,
                monto,
                tipo,
                categoria,
                estado: "pendiente",
                user_id: perfil.id,
                familia_id: perfil.familia_id,
                fecha_vencimiento
            });

        if (insertError) {
            return NextResponse.json({
                error: "Error al insertar transacción",
                diagnostico: { mensaje: insertError.message, code: insertError.code }
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "¡Transacción registrada exitosamente!"
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Error desconocido";
        return NextResponse.json({ error: "Error interno", diagnostico: msg }, { status: 500 });
    }
}
