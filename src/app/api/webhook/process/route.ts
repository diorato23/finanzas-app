import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTransaccionInternal } from "@/app/dashboard/transacciones/actions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization")?.trim() || "vazio";
    
    // O Docker frequentemente injeta aspas ("") ou espaços invisíveis no final das variáveis no .env
    // Isso limpa a string para garantir uma comparação de texto justa
    const rawSecret = process.env.N8N_WEBHOOK_SECRET;
    const cleanSecret = rawSecret?.replace(/['"]/g, '')?.trim();

    // 1. Validar Secret
    if (!cleanSecret || authHeader !== `Bearer ${cleanSecret}`) {
        return NextResponse.json({ 
            error: "No autorizado",
            diagnostico: {
                header_recebido: authHeader,
                servidor_tem_senha: !!rawSecret,
                senha_tamanho_real: rawSecret?.length || 0,
                senha_tamanho_limpa: cleanSecret?.length || 0
            }
        }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { whatsapp, descripcion, monto, tipo, categoria, estado, fecha_vencimiento, comprobante_url } = body;

        if (!whatsapp || !descripcion || !monto) {
            return NextResponse.json({ error: "Dados incompletos (whatsapp, descripcion, monto são obrigatórios)" }, { status: 400 });
        }

        const supabase = await createClient();

        // 2. Buscar Perfil pelo WhatsApp
        // O número deve vir no formato string puro (ex: "5511999999999")
        const { data: perfil, error: perfilError } = await supabase
            .from("perfiles")
            .select("id, familia_id")
            .eq("whatsapp", whatsapp)
            .single();

        if (perfilError || !perfil) {
            console.error("Perfil não encontrado para o WhatsApp:", whatsapp);
            return NextResponse.json({ error: "Usuário não encontrado para este número de WhatsApp" }, { status: 404 });
        }

        // 3. Criar Transação
        const result = await createTransaccionInternal({
            descripcion,
            monto: Number(monto),
            tipo: tipo || "pago",
            categoria: categoria || "Outros",
            estado: estado || "pendiente",
            user_id: perfil.id,
            familia_id: perfil.familia_id,
            fecha_vencimiento: fecha_vencimiento || null,
            comprobante_url: comprobante_url || null
        });

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Transação criada com sucesso!" });

    } catch (error) {
        console.error("Erro no Webhook:", error);
        return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
    }
}
