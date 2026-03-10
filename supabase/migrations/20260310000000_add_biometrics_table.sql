-- Migração para suporte a Biometria (WebAuthn/Passkeys)
CREATE TABLE IF NOT EXISTS public.user_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    name TEXT -- Nome amigável do dispositivo
);

-- Habilitar RLS
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Usuários podem ver suas próprias credenciais"
    ON public.user_credentials FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias credenciais"
    ON public.user_credentials FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias credenciais"
    ON public.user_credentials FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
