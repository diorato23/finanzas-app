"use server"

import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from "@simplewebauthn/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

const RP_ID = "localhost" // Ajustar para o domínio real em produção
const ORIGIN = `http://${RP_ID}:3000` // Ajustar para https e domínio em produção

/**
 * Passo 1: Gerar opções de registro (atividades no Dashboard)
 */
export async function getRegistrationOptions() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Não autorizado")

    const { data: credentials } = await supabase
        .from("user_credentials")
        .select("credential_id")
        .eq("user_id", user.id)

    const options = await generateRegistrationOptions({
        rpName: "Finanzas App",
        rpID: RP_ID,
        userID: user.id,
        userName: user.email || "usuario@app.com",
        attestationType: "none",
        excludeCredentials: credentials?.map((c) => ({
            id: c.credential_id,
            type: "public-key",
        })),
        authenticatorSelection: {
            residentKey: "preferred",
            userVerification: "preferred",
            authenticatorAttachment: "platform", // Forçar FaceID/TouchID/Windows Hello
        },
    })

    // Salvar o challenge no cookie temporário (1 minuto)
    const cookieStore = await cookies()
    cookieStore.set("registration_challenge", options.challenge, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60,
    })

    return options
}

/**
 * Passo 2: Verificar e salvar a nova credencial
 */
export async function verifyRegistration(body: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autorizado")

    const cookieStore = await cookies()
    const expectedChallenge = cookieStore.get("registration_challenge")?.value

    if (!expectedChallenge) throw new Error("Desafio expirado ou ausente")

    const verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
    })

    if (verification.verified && verification.registrationInfo) {
        const { credentialID, publicKey, counter } = verification.registrationInfo

        const { error } = await supabase.from("user_credentials").insert({
            user_id: user.id,
            credential_id: Buffer.from(credentialID).toString("base64url"),
            public_key: Buffer.from(publicKey).toString("base64url"),
            counter,
            name: "Dispositivo Biométrico",
        })

        if (error) throw new Error("Erro ao salvar credencial: " + error.message)

        revalidatePath("/dashboard")
        return { success: true }
    }

    return { success: false }
}

/**
 * Passo 3: Gerar opções de autenticação (na tela de Login)
 */
export async function getAuthenticationOptions() {
    // Nota: Como não sabemos quem é o usuário ainda, 
    // geramos opções genéricas ou pedimos o e-mail primeiro.
    // Para simplificar "Acesso Rápido", pediremos que o usuário digite o e-mail ou usaremos credenciais residentes.

    const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        userVerification: "preferred",
    })

    const cookieStore = await cookies()
    cookieStore.set("authentication_challenge", options.challenge, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60,
    })

    return options
}

/**
 * Passo 4: Verificar login biométrico
 */
export async function verifyAuthentication(body: any) {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const expectedChallenge = cookieStore.get("authentication_challenge")?.value

    if (!expectedChallenge) throw new Error("Desafio expirado")

    // Buscar a credencial no banco pelo ID enviado pelo navegador
    const credentialID = body.id
    const { data: dbCredential } = await supabase
        .from("user_credentials")
        .select("*")
        .eq("credential_id", credentialID)
        .single()

    if (!dbCredential) throw new Error("Credencial não reconhecida")

    const verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        authenticator: {
            credentialID: Buffer.from(dbCredential.credential_id, "base64url"),
            credentialPublicKey: Buffer.from(dbCredential.public_key, "base64url"),
            counter: Number(dbCredential.counter),
        },
    })

    if (verification.verified) {
        // Se verificado, precisamos logar o usuário no Supabase.
        // O Supabase não tem login direto por WebAuthn nativo (sem usar o Auth deles), 
        // então aqui usaríamos um Custom JWT ou uma sessão administrativa temporária.

        // ESTRATÉGIA: Como é um app de controle interno, podemos usar o 
        // ID do usuário recuperado do banco e criar uma sessão via Admin Auth 
        // (servidor-side ONLY) se o Supabase Admin estiver configurado.

        // Por enquanto, retornaremos sucesso para o cliente prosseguir.
        return { success: true, userId: dbCredential.user_id }
    }

    return { success: false }
}
