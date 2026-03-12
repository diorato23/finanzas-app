import { NextRequest, NextResponse } from "next/server";
import { authenticateWebhook, parseBody } from "../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const body = await parseBody(req);
        const action = String(body.action || "crear").trim();
        const auth = await authenticateWebhook(req, body);

        if (!auth.ok) return auth.response;

        const { supabase, perfil } = auth;

        switch (action) {
            case "crear":
                return await crearTransaccion(supabase, perfil, body);
            case "listar":
                return await listarTransacciones(supabase, perfil, body);
            case "eliminar":
                return await eliminarTransaccion(supabase, perfil, body);
            case "editar":
                return await editarTransaccion(supabase, perfil, body);
            default:
                return NextResponse.json(
                    { error: `Acción '${action}' no válida. Usa: crear, listar, eliminar, editar` },
                    { status: 400 }
                );
        }
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Error desconocido";
        return NextResponse.json({ error: "Error interno", detalle: msg }, { status: 500 });
    }
}

// ──────────────────────────────────────
// CREAR
// ──────────────────────────────────────
// ──────────────────────────────────────
// CREAR
// ──────────────────────────────────────
async function crearTransaccion(
    supabase: any,
    perfil: { id: string; familia_id: string },
    body: Record<string, unknown>
) {
    const descripcion = String(body.descripcion || "").trim();
    const monto = Number(body.monto) || 0;
    const tipo = String(body.tipo || "pago").trim();
    const categoria = String(body.categoria || "Otros").trim();
    const fecha_vencimiento = body.fecha_vencimiento ? String(body.fecha_vencimiento) : null;

    if (!descripcion || !monto) {
        return NextResponse.json(
            { error: "Campos 'descripcion' y 'monto' son obligatorios." },
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
        return NextResponse.json({ error: "Error al registrar transacción", detalle: error.message }, { status: 500 });
    }

    const tipoEmoji = tipo === "cobro" ? "📈" : "📉";

    return NextResponse.json({
        success: true,
        message: `${tipoEmoji} *¡Listo!* He registrado tu transacción:\n\n*${descripcion}*\n💰 *Valor:* $${monto.toLocaleString("es-CO")}\n📂 *Categoría:* ${categoria}`
    });
}

// ──────────────────────────────────────
// LISTAR
// ──────────────────────────────────────
// ──────────────────────────────────────
// LISTAR
// ──────────────────────────────────────
async function listarTransacciones(
    supabase: any,
    perfil: { id: string; familia_id: string },
    body: Record<string, unknown>
) {
    const limite = Math.min(Number(body.limite) || 5, 20);

    const { data, error } = await supabase
        .from("transacciones")
        .select("id, descripcion, monto, tipo, categoria, estado, created_at, fecha_vencimiento")
        .eq("familia_id", perfil.familia_id)
        .order("created_at", { ascending: false })
        .limit(limite);

    if (error) {
        return NextResponse.json({ error: "Error al listar", detalle: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
        return NextResponse.json({
            success: true,
            message: "📭 No encontré transacciones recientes."
        });
    }

    let message = "📝 *Tus últimas transacciones:*\n\n";
    data.forEach(t => {
        const emoji = t.tipo === "cobro" ? "📈" : "📉";
        const monto = Number(t.monto).toLocaleString("es-CO");
        message += `${emoji} *${t.descripcion}*\n💰 $${monto} | 📂 ${t.categoria}\n🆔 \`${t.id}\`\n\n`;
    });

    return NextResponse.json({
        success: true,
        total: data.length,
        message: message.trim(),
        transacciones: data
    });
}

// ──────────────────────────────────────
// ELIMINAR
// ──────────────────────────────────────
// ──────────────────────────────────────
// ELIMINAR
// ──────────────────────────────────────
async function eliminarTransaccion(
    supabase: any,
    perfil: { id: string; familia_id: string },
    body: Record<string, unknown>
) {
    const transaccion_id = String(body.transaccion_id || "").trim();

    if (!transaccion_id) {
        return NextResponse.json({ error: "El campo 'transaccion_id' es obligatorio." }, { status: 400 });
    }

    const { data: existing, error: findError } = await supabase
        .from("transacciones")
        .select("id, descripcion, monto")
        .eq("id", transaccion_id)
        .eq("familia_id", perfil.familia_id)
        .maybeSingle();

    if (findError || !existing) {
        return NextResponse.json({ error: "Transacción no encontrada o no tienes permisos." }, { status: 404 });
    }

    const { error } = await supabase
        .from("transacciones")
        .delete()
        .eq("id", transaccion_id);

    if (error) {
        return NextResponse.json({ error: "Error al eliminar la transacción", detalle: error.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        message: `🗑️ *He eliminado la transacción:* "${existing.descripcion}" de $${Number(existing.monto).toLocaleString("es-CO")}.`
    });
}

// ──────────────────────────────────────
// EDITAR
// ──────────────────────────────────────
// ──────────────────────────────────────
// EDITAR
// ──────────────────────────────────────
async function editarTransaccion(
    supabase: any,
    perfil: { id: string; familia_id: string },
    body: Record<string, unknown>
) {
    const transaccion_id = String(body.transaccion_id || "").trim();

    if (!transaccion_id) {
        return NextResponse.json({ error: "El campo 'transaccion_id' es obligatorio." }, { status: 400 });
    }

    const { data: existing, error: findError } = await supabase
        .from("transacciones")
        .select("id, descripcion, monto")
        .eq("id", transaccion_id)
        .eq("familia_id", perfil.familia_id)
        .maybeSingle();

    if (findError || !existing) {
        return NextResponse.json({ error: "Transacción no encontrada o no tienes permisos." }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (body.descripcion) updates.descripcion = String(body.descripcion).trim();
    if (body.monto) updates.monto = Number(body.monto);
    if (body.tipo) {
        const t = String(body.tipo).trim().toLowerCase();
        updates.tipo = t === "ingreso" || t === "cobro" ? "cobro" : "pago";
    }
    if (body.categoria) updates.categoria = String(body.categoria).trim();
    if (body.estado) updates.estado = String(body.estado).trim();
    if (body.fecha_vencimiento) updates.fecha_vencimiento = String(body.fecha_vencimiento);

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No hay campos para actualizar." }, { status: 400 });
    }

    const { error } = await supabase
        .from("transacciones")
        .update(updates)
        .eq("id", transaccion_id);

    if (error) {
        return NextResponse.json({ error: "Error al editar la transacción", detalle: error.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        message: `✏️ *He actualizado la transacción:* "${updates.descripcion || existing.descripcion}".`,
        campos_modificados: Object.keys(updates)
    });
}
