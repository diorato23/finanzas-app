-- =====================================================
-- Migração: Adicionar campo WhatsApp em perfiles
-- Objetivo: Permitir o bot do n8n identificar o usuário
-- pelo número de WhatsApp ao registrar transações
-- =====================================================

-- 1. Adicionar coluna whatsapp na tabela perfiles
ALTER TABLE public.perfiles
ADD COLUMN IF NOT EXISTS whatsapp TEXT UNIQUE;

-- 2. Vincular o número de WhatsApp do admin
-- IMPORTANTE: Confirme o email abaixo antes de executar
-- Para verificar, rode primeiro: SELECT id, nombre, rol FROM perfiles;
UPDATE public.perfiles
SET whatsapp = '573138310085'
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'admin@test.com' LIMIT 1
);

-- 3. Verificar resultado (opcional, rode separado)
-- SELECT p.id, p.nombre, p.rol, p.whatsapp, u.email
-- FROM perfiles p
-- JOIN auth.users u ON u.id = p.id;
