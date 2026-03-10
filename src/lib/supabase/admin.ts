import { createClient } from "@supabase/supabase-js"

/**
 * Cliente admin para operações que requerem bypass de RLS ou gerenciamento de usuários.
 * NUNCA use este cliente no lado do cliente (browser).
 */
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}
