-- =============================================================================
-- CSM Decor — Supabase Schema v1.0
-- Execute no SQL Editor do seu projeto:
-- Dashboard > SQL Editor > New query > cole e execute
-- =============================================================================

-- 1. TABELA DE PERFIS (estende auth.users com dados de negócio)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL DEFAULT '',
  tipo        TEXT        NOT NULL DEFAULT 'comum'
              CHECK (tipo IN ('comum', 'arquiteto', 'fornecedor')),
  role        TEXT        NOT NULL DEFAULT 'user'
              CHECK (role IN ('user', 'admin')),
  genero      TEXT        NOT NULL DEFAULT '',
  photo_url   TEXT        NOT NULL DEFAULT '',
  bio         TEXT        NOT NULL DEFAULT '',
  instagram   TEXT        NOT NULL DEFAULT '',
  cau         TEXT        NOT NULL DEFAULT '',   -- Registro CAU (arquitetos)
  cnpj        TEXT        NOT NULL DEFAULT '',   -- CNPJ (fornecedores)
  is_partner  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Usuário lê o próprio perfil
CREATE POLICY "profiles_own_select" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Usuário insere o próprio perfil (criado pelo trigger)
CREATE POLICY "profiles_own_insert" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Usuário atualiza o próprio perfil, mas não pode alterar o próprio 'role'
CREATE POLICY "profiles_own_update" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Admin pode ler qualquer perfil
CREATE POLICY "profiles_admin_select" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin pode atualizar qualquer perfil (inclusive mudar role)
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. TRIGGER: cria perfil automaticamente ao registrar usuário
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, tipo, genero, cau, cnpj, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name',   ''),
    COALESCE(NEW.raw_user_meta_data->>'tipo',   'comum'),
    COALESCE(NEW.raw_user_meta_data->>'genero', ''),
    COALESCE(NEW.raw_user_meta_data->>'cau',    ''),
    COALESCE(NEW.raw_user_meta_data->>'cnpj',   ''),
    'user'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- PASSOS MANUAIS (fazer no Dashboard após rodar este SQL)
-- =============================================================================

-- 4. CRIAR CONTA ADMIN
-- Dashboard > Authentication > Users > Add user
--   E-mail: admin@csmdecor.com.br
--   Senha: escolha uma senha forte (mín. 12 chars)
-- Após criar, copie o UUID gerado e execute:
--
-- UPDATE public.profiles
-- SET role = 'admin', is_partner = true, name = 'Admin CSM'
-- WHERE id = 'COLE-O-UUID-DO-ADMIN-AQUI';

-- 5. BUCKET DE AVATARES (Storage)
-- Dashboard > Storage > New bucket
--   Nome:   avatars
--   Public: SIM (URLs públicas para fotos de perfil)
--   Allowed MIME types: image/jpeg, image/png, image/webp
--   Max file size: 2097152  (2 MB)
--
-- Políticas do bucket (Storage > avatars > Policies):
--   SELECT  → true                                    (leitura pública)
--   INSERT  → auth.uid()::text = (storage.foldername(name))[1]
--   UPDATE  → auth.uid()::text = (storage.foldername(name))[1]
--   DELETE  → auth.uid()::text = (storage.foldername(name))[1]

-- 6. CONFIGURAR E-MAILS (Authentication > Email Templates)
-- Confirme que "Enable email confirmations" está ATIVADO
-- Personalize os templates em português se quiser
-- Para SMTP real (sem quota do Supabase): Authentication > SMTP Settings
