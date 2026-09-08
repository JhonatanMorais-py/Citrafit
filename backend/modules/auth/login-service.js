import { env } from "../../config/env.js";
import { supabaseAdmin } from "../../config/supabase.js";

export async function authenticateUser({ email, password }) {
  const baseUrl = env.supabaseUrl.replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: env.supabaseServiceRoleKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });

  const session = await response.json();
  if (!response.ok) return { error: "INVALID_CREDENTIALS" };

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("cad_perfis")
    .select("nome, altura_cm, peso_kg")
    .eq("id", session.user.id)
    .single();

  if (profileError) throw profileError;

  return {
    session: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
    },
    user: {
      id: session.user.id,
      email: session.user.email,
      name: profile.nome,
      height: profile.altura_cm,
      weight: profile.peso_kg,
    },
  };
}
