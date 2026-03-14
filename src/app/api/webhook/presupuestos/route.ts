import { NextRequest, NextResponse } from "next/server";
import { authenticateWebhook, parseBody } from "../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const body = await parseBody(req);
        const action = String(body.action || "consultar").trim();
        const auth = await authenticateWebhook(req, body);

        if (!auth.ok) return auth.response;

        const { supabase, perfil } = auth;

        switch (action) {
            case "definir":
            case "set":
            case "editar":
            case "update":
                return await definirPresupuesto(supabase, perfil, body);
            case "consultar":
            case "get":
                return await consultarPresupuesto(supabase, perfil, body);
            default:
                return NextResponse.json(
                    { error: `Acción '${action}' no válida. Usa: definir (set), consultar (get)` },
                    { status: 400 }
                );
        }
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Error desconocido";
        return NextResponse.json({ error: "Error interno", detalle: msg }, { status: 500 });
    }
}

// ──────────────────────────────────────
// DEFINIR / ACTUALIZAR PRESUPUESTO
// ──────────────────────────────────────
async function definirPresupuesto(
    supabase: any,
    perfil: { id: string; familia_id: string; rol: string },
    body: Record<string, unknown>
) {
    if (perfil.rol !== "admin" && perfil.rol !== "co_admin") {
        return NextResponse.json({ error: "Solo administradores pueden definir presupuestos" }, { status: 403 });
    }

    const categoria = String(body.categoria || "").trim();
    const monto_limite = Number(body.monto_limite) || 0;
    const now = new Date();
    const mesAnio = String(body.mes_anio || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`).trim();

    if (!categoria || !monto_limite) {
        return NextResponse.json({ error: "Campos 'categoria' y 'monto_limite' son obligatorios" }, { status: 400 });
    }

    // Upsert: update if exists, insert if not
    const { data: existing } = await supabase
        .from("presupuestos")
        .select("id")
        .eq("familia_id", perfil.familia_id)
        .eq("categoria", categoria)
        .eq("mes_anio", mesAnio)
        .single();

    if (existing) {
        await supabase.from("presupuestos").update({ monto_limite }).eq("id", existing.id);
    } else {
        await supabase.from("presupuestos").insert({
            familia_id: perfil.familia_id,
            categoria,
            monto_limite,
            mes_anio: mesAnio
        });
    }

    const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;

    return NextResponse.json({
        success: true,
        message: `💰 Presupuesto de ${categoria} definido en ${fmt(monto_limite)} para ${mesAnio}`
    });
}

// ──────────────────────────────────────
// CONSULTAR PRESUPUESTOS
// ──────────────────────────────────────
async function consultarPresupuesto(
    supabase: any,
    perfil: { id: string; familia_id: string },
    body: Record<string, unknown>
) {
    const now = new Date();
    const mesAnio = String(body.mes_anio || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`).trim();
    const primerDia = `${mesAnio}-01`;
    const ultimoDia = `${mesAnio}-31`;

    // Get budgets
    const { data: presupuestos } = await supabase
        .from("presupuestos")
        .select("categoria, monto_limite")
        .eq("familia_id", perfil.familia_id)
        .eq("mes_anio", mesAnio);

    if (!presupuestos || presupuestos.length === 0) {
        return NextResponse.json({
            success: true,
            mensaje: `No tienes presupuestos definidos para ${mesAnio}`,
            presupuestos: []
        });
    }

    // Get spending per category
    const { data: transacciones } = await supabase
        .from("transacciones")
        .select("categoria, monto")
        .eq("familia_id", perfil.familia_id)
        .eq("tipo", "pago")
        .gte("created_at", primerDia)
        .lte("created_at", ultimoDia + "T23:59:59");

    const gastosPorCat: Record<string, number> = {};
    (transacciones || []).forEach((t: any) => {
        const cat = t.categoria || "Otros";
        gastosPorCat[cat] = (gastosPorCat[cat] || 0) + Number(t.monto);
    });

    const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;

    const resultado = presupuestos.map((p: any) => {
        const gastado = gastosPorCat[p.categoria] || 0;
        const restante = p.monto_limite - gastado;
        const porcentaje = Math.round((gastado / p.monto_limite) * 100);

        return {
            categoria: p.categoria,
            limite: fmt(p.monto_limite),
            gastado: fmt(gastado),
            restante: fmt(restante),
            porcentaje: `${porcentaje}%`,
            alerta: porcentaje >= 90 ? "⚠️ Cerca del límite" : porcentaje >= 100 ? "🚨 Excedido" : "✅ OK"
        };
    });

    return NextResponse.json({
        success: true,
        periodo: mesAnio,
        presupuestos: resultado
    });
}
