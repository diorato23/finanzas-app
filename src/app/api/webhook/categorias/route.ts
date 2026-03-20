import { NextRequest, NextResponse } from "next/server";
import { authenticateWebhook, parseBody } from "../lib/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const body = await parseBody(req);
        const action = String(body.action || "listar").trim();
        const auth = await authenticateWebhook(req, body);

        if (!auth.ok) return auth.response;

        const { supabase, perfil } = auth;

        switch (action) {
            case "listar":
            case "list":
                return await listarCategorias(supabase, perfil);
            case "crear":
            case "create":
                return await crearCategoria(supabase, perfil, body);
            case "eliminar":
            case "delete":
                return await eliminarCategoria(supabase, perfil, body);
            default:
                return NextResponse.json(
                    { error: `Acción '${action}' no válida. Usa: listar (list), crear (create), eliminar (delete)` },
                    { status: 400 }
                );
        }
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Error desconocido";
        return NextResponse.json({ error: "Error interno", detalle: msg }, { status: 500 });
    }
}

// ──────────────────────────────────────
// LISTAR
// ──────────────────────────────────────
type CategoriaRow = { id: string; nombre: string };

async function listarCategorias(
    supabase: SupabaseClient,
    perfil: { id: string; familia_id: string }
) {
    const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre")
        .eq("familia_id", perfil.familia_id)
        .order("nombre", { ascending: true });

    if (error) {
        return NextResponse.json({ error: "Error al listar", detalle: error.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        total: (data || []).length,
        categorias: ((data ?? []) as unknown as CategoriaRow[]).map((c: CategoriaRow) => ({ id: c.id, nombre: c.nombre }))
    });
}

// ──────────────────────────────────────
// CREAR
// ──────────────────────────────────────
async function crearCategoria(
    supabase: SupabaseClient,
    perfil: { id: string; familia_id: string; rol: string },
    body: Record<string, unknown>
) {
    if (perfil.rol !== "admin" && perfil.rol !== "co_admin") {
        return NextResponse.json({ error: "Solo administradores pueden crear categorías" }, { status: 403 });
    }

    const rawName = String(body.nombre || "").trim();
    if (!rawName || rawName.length < 2) {
        return NextResponse.json({ error: "El nombre debe tener al menos 2 caracteres" }, { status: 400 });
    }

    // Normaliza: remove palavras comuns e capitaliza (Title Case)
    const stopWords = ["categoria", "categoría", "categorias", "categorías", "nueva", "novo", "nova", "de", "la", "el"];
    const nombre = rawName
        .split(/\s+/)
        .filter(w => !stopWords.includes(w.toLowerCase()))
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
        .trim() || rawName.charAt(0).toUpperCase() + rawName.slice(1);

    const { error } = await supabase
        .from("categorias")
        .insert({ nombre, familia_id: perfil.familia_id });

    if (error) {
        return NextResponse.json({ error: "Error al crear categoría", detalle: error.message }, { status: 500 });
    }

    revalidatePath("/dashboard", "layout");

    return NextResponse.json({
        success: true,
        message: `📁 Categoría "${nombre}" creada correctamente`
    });
}

// ──────────────────────────────────────
// ELIMINAR
// ──────────────────────────────────────
async function eliminarCategoria(
    supabase: SupabaseClient,
    perfil: { id: string; familia_id: string; rol: string },
    body: Record<string, unknown>
) {
    if (perfil.rol !== "admin" && perfil.rol !== "co_admin") {
        return NextResponse.json({ error: "Solo administradores pueden eliminar categorías" }, { status: 403 });
    }

    const categoria_id = String(body.categoria_id || "").trim();
    if (!categoria_id) {
        return NextResponse.json({ error: "Campo 'categoria_id' es obligatorio" }, { status: 400 });
    }

    const { data: existing } = await supabase
        .from("categorias")
        .select("id, nombre")
        .eq("id", categoria_id)
        .eq("familia_id", perfil.familia_id)
        .single();

    if (!existing) {
        return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    const { error } = await supabase
        .from("categorias")
        .delete()
        .eq("id", categoria_id);

    if (error) {
        return NextResponse.json({ error: "Error al eliminar", detalle: error.message }, { status: 500 });
    }

    revalidatePath("/dashboard", "layout");

    return NextResponse.json({
        success: true,
        message: `🗑️ Categoría "${existing.nombre}" eliminada`
    });
}
