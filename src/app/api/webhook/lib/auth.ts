import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type AuthResult =
    | { ok: true; supabase: SupabaseClient; perfil: { id: string; familia_id: string; rol: string }; whatsapp: string }
    | { ok: false; response: NextResponse };

/**
 * Validates Bearer token, creates admin Supabase client,
 * and resolves the user profile by WhatsApp number.
 */
export async function authenticateWebhook(req: NextRequest, body: Record<string, unknown>): Promise<AuthResult> {
    const authHeader = req.headers.get("authorization")?.trim() || "";
    const rawSecret = process.env.N8N_WEBHOOK_SECRET;
    const cleanSecret = rawSecret?.replace(/['"]/g, "")?.trim();

    if (!cleanSecret || authHeader !== `Bearer ${cleanSecret}`) {
        return { ok: false, response: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        return {
            ok: false,
            response: NextResponse.json({ error: "Configuración del servidor incompleta" }, { status: 500 })
        };
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const whatsapp = String(body.whatsapp || "").trim();

    if (!whatsapp) {
        return {
            ok: false,
            response: NextResponse.json({ error: "Campo 'whatsapp' es obligatorio" }, { status: 400 })
        };
    }

    const { data: perfil, error: perfilError } = await supabase
        .from("perfiles")
        .select("id, familia_id, rol")
        .eq("whatsapp", whatsapp)
        .single();

    if (perfilError || !perfil) {
        return {
            ok: false,
            response: NextResponse.json({ error: "Usuario no encontrado para este WhatsApp" }, { status: 404 })
        };
    }

    return { ok: true, supabase, perfil, whatsapp };
}

/**
 * Parses request body — supports JSON and form-urlencoded (n8n keypair mode)
 */
export async function parseBody(req: NextRequest): Promise<Record<string, unknown>> {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await req.text();
        const params = new URLSearchParams(text);
        return Object.fromEntries(params.entries());
    }
    return await req.json();
}
