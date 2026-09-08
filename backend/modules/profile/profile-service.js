import { supabaseAdmin } from "../../config/supabase.js";

export async function getAuthenticatedUser(accessToken) {
  if (!accessToken) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}

export async function updateProfile(userId, { height, weight }) {
  const { data, error } = await supabaseAdmin
    .from("cad_perfis")
    .update({
      altura_cm: height,
      peso_kg: weight,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("altura_cm, peso_kg")
    .single();

  if (error) throw error;
  return data;
}
