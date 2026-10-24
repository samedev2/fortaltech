# Fortal Tech — Assistência e Sistemas

Site institucional + painel administrativo para assistência técnica de
notebooks e desktops em Fortaleza/CE.

React 19 · Vite 6 · Tailwind CSS 4 · Supabase · Motion

---

## Como rodar

**Pré-requisitos:** Node.js 18+

```bash
npm install
cp .env.example .env.local   # preencha as variáveis
npm run dev                  # http://localhost:3000
```

| Script            | O que faz                                          |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento (porta 3000, host 0.0.0.0) |
| `npm run build`   | Build de produção em `dist/`                       |
| `npm run preview` | Serve o build de produção localmente               |
| `npm run lint`    | Checagem de tipos (`tsc --noEmit`)                 |

## Variáveis de ambiente

| Variável                 | Descrição                                                       |
| ------------------------ | --------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | URL base da instância self-hosted (a mesma do Studio)             |
| `VITE_SUPABASE_ANON_KEY` | Chave pública anon da sua instância                              |
| `VITE_ADMIN_EMAIL`       | E-mail autorizado a acessar o painel. Vazio = painel desabilitado |

Não há fallback embutido no código: se as variáveis faltarem, o app mostra
uma **tela de configuração pendente** com o `.env` esperado, em vez de um
erro genérico de conexão.

## Banco de dados

O app usa **Supabase self-hosted** (compatível com a stack oficial
docker-compose). O cliente `supabase-js` é o mesmo das instâncias cloud —
mudar de host não exige mudança de código.

Execute [`schema.sql`](./schema.sql) no SQL Editor da sua instância. O
script é **idempotente**: pode rodar quantas vezes quiser sem duplicar
conteúdo nem serviços.

> **Antes de executar:** troque o e-mail do admin em **um único lugar** — o
> bloco `DO $$` no fim do `schema.sql`. Todas as políticas de RLS usam
> essa variável. O mesmo e-mail precisa estar em `VITE_ADMIN_EMAIL`.

### Checklist da instância self-hosted

| Passo | Onde |
| ----- | ---- |
| **CORS** | `API_CORS_ALLOWED_ORIGINS` no `.env` do docker-compose da instância. Sem isso o navegador bloqueia toda requisição. |
| **Site URL / Redirect URLs** | Studio → Authentication → URL Configuration |
| **Usuário admin** | Studio → Authentication → Users → Add user (mesmo e-mail do `VITE_ADMIN_EMAIL`) |
| **Bucket `notebooks`** | Studio → Storage → New bucket, Public = ON (o SQL Editor pode não ter permissão para criar bucket no self-hosted) |
| **Schema** | SQL Editor → colar e executar `schema.sql` |

### Por que existe a função `increment_visits()`

A tabela `site_content` é **somente leitura** para o público — a RLS só libera
`SELECT`. Um `UPDATE` anônimo do contador de visitas seria sempre negado, e o
número de visitas ficaria congelado.

O `schema.sql` cria a função `public.increment_visits()` com `SECURITY DEFINER`
e a libera para `anon`. É o **único** caminho de escrita público, e ela só toca
a chave `visits`. Se você já tem o banco no ar, rode apenas o bloco da função:

```sql
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
```



## Estrutura

```
src/
├── App.tsx                  # Orquestração: dados, auth e roteamento de views
├── index.css                # Design system (tokens, componentes, utilidades)
├── lib/
│   ├── types.ts             # Tipos de domínio (espelham o schema do Supabase)
│   ├── utils.ts             # Formatação (BRL, telefone, data) e validação
│   ├── icons.tsx            # Registro de ícones por serviço + BrandMark
│   └── supabase.ts          # Cliente Supabase
└── components/
    ├── ui/                  # Primitivas: Modal, Button, Field, Toast, Badge,
    │                        #   Skeleton, ConfirmDialog, SectionHeading
    ├── site/                # Site público (Navbar, Hero, Serviços, eGPU,
    │                        #   Notebooks, Velocidade, Contato, Rodapé)
    └── admin/               # Painel admin (abas + modais de CRUD)
```

### Onde ficam as regras de UI

- **Tokens e classes** — `src/index.css`. As classes `btn-*`, `field`,
  `surface`, `container-page`, `section-pad`, `eyebrow` e `display` são o
  vocabulário visual do projeto. Prefira elas a utilitários avulsos.
- **Paleta** — `brand` (esmeralda) é a cor de marca; `accent` (azul) marca
  o tema de hardware/eGPU; `ink-950…600` são as superfícies escuras.
- **Acessibilidade** — foco visível global via `:focus-visible`, modais com
  focus trap e `role="dialog"`, campos com `<label>` real, e respeito a
  `prefers-reduced-motion`.

### Fluxo de dados

`App.tsx` é a **camada de dados**: executa as escritas no Supabase e lança
(`throw`) em caso de erro. A camada de UI que originou a ação é responsável
pelo feedback (`toast`), garantindo **uma única mensagem por ação** —
nunca duas.

## Painel administrativo

Acesse pelo link **"Área do técnico"** no rodapé (ou pelo ícone de login).
Requer autenticação via Supabase Auth e o e-mail precisa bater com
`VITE_ADMIN_EMAIL`.

Abas disponíveis: **Notebooks**, **Serviços**, **Conteúdo** e **Mensagens**.
Notebooks vendidos são arquivados automaticamente após 2 dias.
