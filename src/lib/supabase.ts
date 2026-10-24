import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase — Supabase self-hosted (Hostinger/VPS) ou cloud.
 *
 * A URL e a anon key vêm SEMPRE do `.env.local`. Não existe fallback
 * embutido: com uma URL cloud "de emergência" no código, uma migração
 * self-hosted silenciosamente continuaria batendo no projeto antigo — e a
 * anon key ficaria exposta no bundle.
 */

/** Endpoint inofensivo usado só enquanto o `.env.local` não está configurado. */
const PLACEHOLDER_URL = 'http://localhost:54321';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/**
 * Mensagem de erro de configuração, ou `null` quando tudo está certo.
 * A UI usa isso para mostrar um aviso de setup em vez de um erro genérico
 * de "não foi possível conectar ao banco".
 */
export const configError: string | null = !supabaseUrl
  ? 'VITE_SUPABASE_URL não está definida.'
  : !supabaseAnonKey
    ? 'VITE_SUPABASE_ANON_KEY não está definida.'
    : null;

export const supabase = createClient(
  supabaseUrl || PLACEHOLDER_URL,
  supabaseAnonKey || 'missing-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // O site usa âncoras de hash (#servicos, #notebooks). Deixar o
      // supabase-js "escutar" o hash faria ele tentar interpretá-lo como
      // sessão de OAuth/magic-link e limpá-lo da URL.
      detectSessionInUrl: false,
    },
  },
);
