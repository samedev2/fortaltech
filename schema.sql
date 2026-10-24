-- ═══════════════════════════════════════════════════════════════════════
--  FORTAL TECH — schema do banco (Supabase self-hosted)
--
--  COMO APLICAR (na sua instância self-hosted):
--    1. Abra o SQL Editor do Studio (https://supabase.seudominio.com)
--    2. Cole este arquivo inteiro e execute
--    3. Confira o NOTICE no final: ele mostra o e-mail de admin aplicado
--
--  ANTES DE EXECUTAR:
--    • Troque o e-mail do admin no bloco DO $$ mais abaixo (um único lugar)
--    • O MESMO e-mail precisa estar em VITE_ADMIN_EMAIL no .env.local
--
--  O script é idempotente: pode rodar quantas vezes quiser sem duplicar
--  conteúdo nem serviços.
-- ═══════════════════════════════════════════════════════════════════════

-- Tabela de Notebooks para Fortal Tech - Assistencia e Sistemas
CREATE TABLE IF NOT EXISTS notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model TEXT NOT NULL,
  specs TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  image_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  is_promotional BOOLEAN DEFAULT false,
  is_sold BOOLEAN DEFAULT false,
  sold_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Contatos (Mensagens do formulário)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  service_type TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'read', 'archived'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Serviços (O que aparece no site)
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL, -- Nome do ícone Lucide (ex: 'Monitor', 'Laptop')
  tags TEXT[], -- Array de tags
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Conteúdo do Site (Textos dinâmicos)
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY, -- Chave única (ex: 'hero_title', 'hero_description')
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir conteúdo inicial do site
INSERT INTO site_content (key, value) VALUES 
('hero_title', 'SEU PC COMO NOVO.'),
('hero_description', 'Manutenção preventiva, corretiva e upgrades de alta performance. Especialistas em notebooks e desktops gamer e office em Fortaleza.'),
('whatsapp_number', '5585999910250'),
('site_title', 'FORTAL TECH'),
('visits', '1245'),
('footer_text', '© 2024 Fortal Tech - Assistencia e Sistemas. Todos os direitos reservados.')
ON CONFLICT (key) DO NOTHING;

-- Inserir serviços iniciais.
-- Idempotente por título: reexecutar o script não duplica os serviços
-- (o `ON CONFLICT DO NOTHING` original não segurava, pois a PK é um UUID
-- gerado automaticamente).
DO $$
DECLARE
  s RECORD;
BEGIN
  FOR s IN
    SELECT * FROM (VALUES
      ('Manutenção de Desktop',    'Preventiva, corretiva e aditiva para manter seu PC voando.',          'Monitor',   ARRAY['Limpeza','Hardware','Montagem'], 1),
      ('Notebooks',                'Reparos especializados, troca de telas, teclados e baterias.',           'Laptop',    ARRAY['Reparo','Telas','Baterias'],      2),
      ('Formatação & Sistema',     'Instalação limpa, backup de dados e reparo de erros do Windows.',      'Settings',  ARRAY['Windows','Backup','Drivers'],      3),
      ('Otimização SSD/NVMe',      'Deixe seu sistema 10x mais rápido com otimização de unidade C.',     'Zap',       ARRAY['Velocidade','NVMe','Performance'], 4),
      ('Troca de Pasta Térmica',   'Redução de temperatura e aumento da vida útil do processador.',      'Cpu',       ARRAY['Cooling','Performance','Limpeza'], 5),
      ('Upgrades',                 'Aumento de memória RAM e troca de HD por SSD de alta performance.',   'HardDrive', ARRAY['RAM','SSD','Upgrade'],              6)
    ) AS v(title, description, icon_name, tags, order_index)
  LOOP
    INSERT INTO services (title, description, icon_name, tags, order_index)
    SELECT s.title, s.description, s.icon_name, s.tags, s.order_index
    WHERE NOT EXISTS (SELECT 1 FROM services WHERE services.title = s.title);
  END LOOP;
END $$;

-- Habilitar Row Level Security (RLS) para todas as tabelas
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública
DROP POLICY IF EXISTS "Leitura pública notebooks" ON notebooks;
CREATE POLICY "Leitura pública notebooks" ON notebooks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura pública serviços" ON services;
CREATE POLICY "Leitura pública serviços" ON services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura pública conteúdo" ON site_content;
CREATE POLICY "Leitura pública conteúdo" ON site_content FOR SELECT USING (true);

-- Política de Inserção de Contatos (Público pode enviar mensagens)
DROP POLICY IF EXISTS "Inserção pública contatos" ON contacts;
CREATE POLICY "Inserção pública contatos" ON contacts FOR INSERT WITH CHECK (true);

-- CONFIGURAÇÃO DE STORAGE
-- Criar bucket público para as imagens dos notebooks.
-- Em Supabase self-hosted o serviço de storage roda em container separado:
-- se este INSERT falhar com "permission denied", crie o bucket pela
-- interface (Storage → New bucket → nome "notebooks", Public = ON).
INSERT INTO storage.buckets (id, name, public)
VALUES ('notebooks', 'notebooks', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública das imagens (o site exibe as fotos na vitrine).
DROP POLICY IF EXISTS "Imagens de notebooks são públicas" ON storage.objects;
CREATE POLICY "Imagens de notebooks são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'notebooks');

-- ═══════════════════════════════════════════════════════════════════════
--  CONTADOR DE VISITAS
--
--  A tabela site_content só é gravável pelo admin (ver políticas acima),
--  então um UPDATE anônimo seria sempre negado pela RLS. A função abaixo
--  roda com SECURITY DEFINER e é o ÚNICO caminho de escrita liberado ao
--  público — e ele só toca a chave 'visits'.
--
--  Retorna o novo total (ou NULL se a chave não existir).
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.increment_visits()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  novo bigint;
BEGIN
  UPDATE site_content
  SET value = CASE
      WHEN value ~ '^[0-9]+$' THEN (value::bigint + 1)::text
      ELSE '1'
    END
  WHERE key = 'visits'
  RETURNING value::bigint INTO novo;

  RETURN novo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_visits() TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════
--  ADMINISTRADOR — TROQUE O E-MAIL EM UM ÚNICO LUGAR (bloco abaixo).
--  Todas as políticas de admin usam essa variável; não há mais nenhuma
--  cópia do e-mail espalhada pelo arquivo.
-- ═══════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  admin_email TEXT := 'admin@exemplo.com'; -- ← TROQUE AQUI
BEGIN
  -- Notebooks
  EXECUTE 'DROP POLICY IF EXISTS "Admin total notebooks" ON notebooks';
  EXECUTE format(
    'CREATE POLICY "Admin total notebooks" ON notebooks FOR ALL TO authenticated '
    'USING (auth.jwt() ->> ''email'' = %L) WITH CHECK (auth.jwt() ->> ''email'' = %L)',
    admin_email, admin_email);

  -- Contatos
  EXECUTE 'DROP POLICY IF EXISTS "Admin total contatos" ON contacts';
  EXECUTE format(
    'CREATE POLICY "Admin total contatos" ON contacts FOR ALL TO authenticated '
    'USING (auth.jwt() ->> ''email'' = %L) WITH CHECK (auth.jwt() ->> ''email'' = %L)',
    admin_email, admin_email);

  -- Serviços
  EXECUTE 'DROP POLICY IF EXISTS "Admin total serviços" ON services';
  EXECUTE format(
    'CREATE POLICY "Admin total serviços" ON services FOR ALL TO authenticated '
    'USING (auth.jwt() ->> ''email'' = %L) WITH CHECK (auth.jwt() ->> ''email'' = %L)',
    admin_email, admin_email);

  -- Conteúdo do site
  EXECUTE 'DROP POLICY IF EXISTS "Admin total conteúdo" ON site_content';
  EXECUTE format(
    'CREATE POLICY "Admin total conteúdo" ON site_content FOR ALL TO authenticated '
    'USING (auth.jwt() ->> ''email'' = %L) WITH CHECK (auth.jwt() ->> ''email'' = %L)',
    admin_email, admin_email);

  -- Storage: bucket 'notebooks'
  EXECUTE 'DROP POLICY IF EXISTS "Admin pode inserir imagens" ON storage.objects';
  EXECUTE format(
    'CREATE POLICY "Admin pode inserir imagens" ON storage.objects FOR INSERT TO authenticated '
    'WITH CHECK (bucket_id = ''notebooks'' AND auth.jwt() ->> ''email'' = %L)',
    admin_email);

  EXECUTE 'DROP POLICY IF EXISTS "Admin pode atualizar imagens" ON storage.objects';
  EXECUTE format(
    'CREATE POLICY "Admin pode atualizar imagens" ON storage.objects FOR UPDATE TO authenticated '
    'USING (bucket_id = ''notebooks'' AND auth.jwt() ->> ''email'' = %L)',
    admin_email);

  EXECUTE 'DROP POLICY IF EXISTS "Admin pode deletar imagens" ON storage.objects';
  EXECUTE format(
    'CREATE POLICY "Admin pode deletar imagens" ON storage.objects FOR DELETE TO authenticated '
    'USING (bucket_id = ''notebooks'' AND auth.jwt() ->> ''email'' = %L)',
    admin_email);

  RAISE NOTICE 'Políticas de admin criadas para: %', admin_email;
END $$;
