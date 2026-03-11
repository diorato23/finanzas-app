import { NextRequest, NextResponse } from "next/server";
import { authenticateWebhook, parseBody } from "../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const body = await parseBody(req);
        const action = String(body.action || "resumen_mes").trim();
        const auth = await authenticateWebhook(req, body);

        if (!auth.ok) return auth.response;

        const { supabase, perfil } = auth;

        switch (action) {
            case "resumen_mes":
                return await resumenMes(supabase, perfil);
            case "resumen_periodo":
                return await resumenPeriodo(supabase, perfil, body);
            case "por_categoria":
                return await porCategoria(supabase, perfil, body);
            default:
                return NextResponse.json(
                    { error: `Acción '${action}' no válida. Usa: resumen_mes, resumen_periodo, por_categoria` },
                    { status: 400 }
                );
        }
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Error desconocido";
        return NextResponse.json({ error: "Error interno", detalle: msg }, { status: 500 });
    }
}

// ──────────────────────────────────────
// RESUMEN DEL MES ACTUAL
// ──────────────────────────────────────
async function resumenMes(
    supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>,
    perfil: { id: string; familia_id: string }
) {
    const now = new Date();
    const mesAnio = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const primerDia = `${mesAnio}-01`;
    const ultimoDia = `${mesAnio}-31`;

    const { data, error } = await supabase
        .from("transacciones")
        .select("tipo, monto, categoria")
        .eq("familia_id", perfil.familia_id)
        .gte("created_at", primerDia)
        .lte("created_at", ultimoDia + "T23:59:59");

    if (error) {
        return NextResponse.json({ error: "Error al consultar", detalle: error.message }, { status: 500 });
    }

    let totalGastos = 0;
    let totalIngresos = 0;
    let numTransacciones = 0;

    (data || []).forEach(t => {
        const monto = Number(t.monto);
        if (t.tipo === "cobro") {
            totalIngresos += monto;
        } else {
            totalGastos += monto;
        }
        numTransacciones++;
    });

    const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;

    return NextResponse.json({
        success: true,
        periodo: mesAnio,
        resumen: {
            total_gastos: fmt(totalGastos),
            total_ingresos: fmt(totalIngresos),
            balance: fmt(totalIngresos - totalGastos),
            num_transacciones: numTransacciones
        },
        mensaje: `📊 Resumen de ${mesAnio}: Gastos ${fmt(totalGastos)} | Ingresos ${fmt(totalIngresos)} | Balance ${fmt(totalIngresos - totalGastos)}`
    });
}

// ──────────────────────────────────────
// RESUMEN POR PERÍODO
// ──────────────────────────────────────
async function resumenPeriodo(
    supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>,
    perfil: { id: string; familia_id: string },
    body: Record<string, unknown>
) {
    const fechaInicio = String(body.fecha_inicio || "").trim();
    const fechaFin = String(body.fecha_fin || "").trim();

    if (!fechaInicio || !fechaFin) {
        return NextResponse.json(
            { error: "Campos 'fecha_inicio' y 'fecha_fin' son obligatorios (YYYY-MM-DD)" },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from("transacciones")
        .select("tipo, monto")
        .eq("familia_id", perfil.familia_id)
        .gte("created_at", fechaInicio)
        .lte("created_at", fechaFin + "T23:59:59");

    if (error) {
        return NextResponse.json({ error: "Error al consultar", detalle: error.message }, { status: 500 });
    }

    let totalGastos = 0;
    let totalIngresos = 0;

    (data || []).forEach(t => {
        if (t.tipo === "cobro") totalIngresos += Number(t.monto);
        else totalGastos += Number(t.monto);
    });

    const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;

    return NextResponse.json({
        success: true,
        periodo: { desde: fechaInicio, hasta: fechaFin },
        resumen: {
            total_gastos: fmt(totalGastos),
            total_ingresos: fmt(totalIngresos),
            balance: fmt(totalIngresos - totalGastos),
            num_transacciones: (data || []).length
        }
    });
}

// ──────────────────────────────────────
// GASTOS POR CATEGORÍA
// ──────────────────────────────────────
async function porCategoria(
    supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>,
    perfil: { id: string; familia_id: string },
    body: Record<string, unknown>
) {
    const now = new Date();
    const mesAnio = String(body.mes_anio || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`).trim();
    const primerDia = `${mesAnio}-01`;
    const ultimoDia = `${mesAnio}-31`;

    const { data, error } = await supabase
        .from("transacciones")
        .select("tipo, monto, categoria")
        .eq("familia_id", perfil.familia_id)
        .eq("tipo", "pago")
        .gte("created_at", primerDia)
        .lte("created_at", ultimoDia + "T23:59:59");

    if (error) {
        return NextResponse.json({ error: "Error al consultar", detalle: error.message }, { status: 500 });
    }

    const categorias: Record<string, { total: number; count: number }> = {};

    (data || []).forEach(t => {
        const cat = t.categoria || "Otros";
        if (!categorias[cat]) categorias[cat] = { total: 0, count: 0 };
        categorias[cat].total += Number(t.monto);
        categorias[cat].count++;
    });

    const resultado = Object.entries(categorias)
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([nombre, datos]) => ({
            categoria: nombre,
            total: `$${datos.total.toLocaleString("es-CO")}`,
            transacciones: datos.count
        }));

    return NextResponse.json({
        success: true,
        periodo: mesAnio,
        categorias: resultado
    });
}
