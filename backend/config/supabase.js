import { createClient } from "@supabase/supabase-js";

import { env } from "./env.js";

/**
 * Cliente privilegiado exclusivo do backend.
 * Nunca importe este módulo em código entregue ao navegador.
 */
export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
